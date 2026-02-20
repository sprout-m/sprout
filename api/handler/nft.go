package handler

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// NFTMetadata serves the HIP-412 metadata JSON for a listing NFT.
// The URL for this endpoint is stored as the HTS token metadata bytes at mint time,
// so wallets and explorers can fetch it without authentication.
func (h *Handler) NFTMetadata(c *gin.Context) {
	listingID, ok := parseUUID(c, "id")
	if !ok {
		return
	}

	var name, category, askingRange, location string
	var verified bool
	var serial int64
	var industryTags []string

	err := h.db.QueryRow(context.Background(), `
		SELECT anonymized_name, category, COALESCE(asking_range,''), COALESCE(location,''),
		       verified, COALESCE(nft_serial_number,0), COALESCE(industry_tags,'{}')
		FROM listings WHERE id = $1
	`, listingID).Scan(&name, &category, &askingRange, &location, &verified, &serial, &industryTags)
	if err != nil {
		fail(c, http.StatusNotFound, "listing not found")
		return
	}

	base := strings.TrimRight(h.cfg.AppBaseURL, "/")
	imageURL := fmt.Sprintf("%s/api/v1/nft/image/%s", base, listingID)

	desc := category
	if askingRange != "" {
		desc += " · " + askingRange
	}
	if location != "" {
		desc += " · " + location
	}

	attributes := []gin.H{
		{"trait_type": "Category", "value": category},
		{"trait_type": "Platform", "value": "Meridian"},
	}
	if askingRange != "" {
		attributes = append(attributes, gin.H{"trait_type": "Asking Range", "value": askingRange})
	}
	if location != "" {
		attributes = append(attributes, gin.H{"trait_type": "Location", "value": location})
	}
	if verified {
		attributes = append(attributes, gin.H{"trait_type": "Verified", "value": "Yes"})
	}
	for _, tag := range industryTags {
		attributes = append(attributes, gin.H{"trait_type": "Industry", "value": tag})
	}

	c.Header("Cache-Control", "public, max-age=300")
	c.JSON(http.StatusOK, gin.H{
		"format":      "HIP412@2.0.0",
		"name":        "Meridian — " + name,
		"creator":     "Meridian",
		"description": desc,
		"image":       imageURL,
		"type":        "image/svg+xml",
		"attributes":  attributes,
		"properties": gin.H{
			"listing_id": listingID.String(),
			"platform":   "Meridian",
		},
	})
}

// NFTImage serves a dynamically-generated square SVG (600×600) for a listing NFT.
// Colours and geometry are derived deterministically from the listing UUID so
// every listing gets a unique but stable image. No external dependencies required.
func (h *Handler) NFTImage(c *gin.Context) {
	listingID, ok := parseUUID(c, "id")
	if !ok {
		return
	}

	var name, category, askingRange, location string
	var verified bool
	var serial int64

	err := h.db.QueryRow(context.Background(), `
		SELECT anonymized_name, category, COALESCE(asking_range,''), COALESCE(location,''),
		       verified, COALESCE(nft_serial_number,0)
		FROM listings WHERE id = $1
	`, listingID).Scan(&name, &category, &askingRange, &location, &verified, &serial)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}

	svg := buildListingNFTSVG(listingID, name, category, askingRange, location, verified, serial)
	c.Header("Content-Type", "image/svg+xml")
	c.Header("Cache-Control", "public, max-age=300")
	c.String(http.StatusOK, svg)
}

// buildListingNFTSVG generates a 600×600 SVG unique to the given listing.
func buildListingNFTSVG(id uuid.UUID, name, category, askingRange, location string, verified bool, serial int64) string {
	// Derive a stable hue (0–359) from the first two UUID bytes.
	hue := (int(id[0])<<4 | int(id[1]>>4)) % 360
	accentHue := (hue + 40) % 360

	bg1 := fmt.Sprintf("hsl(%d,55%%,13%%)", hue)
	bg2 := fmt.Sprintf("hsl(%d,60%%,7%%)", (hue+160)%360)
	accent := fmt.Sprintf("hsl(%d,80%%,65%%)", accentHue)

	circles := buildDecorativeCircles(id, accent, accentHue)

	displayName := nftTruncate(name, 24)

	metaLine := xmlEsc(category)
	if location != "" {
		metaLine += "  ·  " + xmlEsc(location)
	}

	var askEl string
	if askingRange != "" {
		askEl = fmt.Sprintf(
			`<text x="30" y="456" font-family="system-ui,-apple-system,sans-serif" font-size="21" font-weight="600" fill="%s">%s</text>`,
			accent, xmlEsc(askingRange),
		)
	}

	footerEls := buildFooterElements(verified, serial, accent)

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.85" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%%" stop-color="%s"/>
      <stop offset="100%%" stop-color="%s"/>
    </linearGradient>
    <linearGradient id="vfade" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%%" stop-color="black" stop-opacity="0.78"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="600" fill="url(#bg)"/>

  <!-- Decorative geometry (UUID-derived) -->
%s
  <!-- Bottom fade for text legibility -->
  <rect y="210" width="600" height="390" fill="url(#vfade)"/>

  <!-- Header band -->
  <rect width="600" height="68" fill="rgba(0,0,0,0.42)"/>

  <!-- MERIDIAN wordmark -->
  <text x="28" y="44" font-family="system-ui,-apple-system,sans-serif" font-size="16" font-weight="700" letter-spacing="4" fill="white" opacity="0.92">MERIDIAN</text>

  <!-- NFT pill -->
  <rect x="508" y="16" width="64" height="30" rx="15" fill="rgba(255,255,255,0.10)"/>
  <text x="540" y="36" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" letter-spacing="1.5" fill="%s" text-anchor="middle">NFT</text>

  <!-- Business name -->
  <text x="30" y="358" font-family="system-ui,-apple-system,sans-serif" font-size="30" font-weight="700" fill="white">%s</text>

  <!-- Category · Location -->
  <text x="30" y="392" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="rgba(255,255,255,0.62)">%s</text>

  <!-- Asking range -->
  %s

  <!-- Footer band -->
  <rect y="514" width="600" height="86" fill="rgba(0,0,0,0.48)"/>

  <!-- Footer: verified badge + serial -->
%s
</svg>`,
		bg1, bg2,
		circles,
		accent,
		xmlEsc(displayName),
		metaLine,
		askEl,
		footerEls,
	)
}

// buildDecorativeCircles generates SVG circle elements positioned and sized
// deterministically from the listing UUID bytes.
func buildDecorativeCircles(id uuid.UUID, accent string, accentHue int) string {
	var sb strings.Builder

	// Filled semi-transparent circles
	for i := 0; i < 5; i++ {
		b := i * 3
		cx := 50 + int(id[b%16])%500       // 50–549
		cy := 75 + int(id[(b+1)%16])%230   // 75–304
		r := 28 + int(id[(b+2)%16])%110    // 28–137
		opacity := 0.05 + float64(id[(b+2)%16]%12)/50.0 // 0.05–0.29
		fill := "white"
		if i%2 == 0 {
			fill = accent
		}
		fmt.Fprintf(&sb, "  <circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"%s\" opacity=\"%.2f\"/>\n",
			cx, cy, r, fill, opacity)
	}

	// Stroke-only rings
	for i := 0; i < 3; i++ {
		b := 6 + i*3
		cx := 60 + int(id[b%16])%480
		cy := 80 + int(id[(b+1)%16])%220
		r := 35 + int(id[(b+2)%16])%130
		opacity := 0.07 + float64(id[(b+1)%16]%10)/50.0
		strokeHue := (accentHue + i*50) % 360
		stroke := fmt.Sprintf("hsl(%d,70%%,68%%)", strokeHue)
		fmt.Fprintf(&sb, "  <circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"none\" stroke=\"%s\" stroke-width=\"1.5\" opacity=\"%.2f\"/>\n",
			cx, cy, r, stroke, opacity)
	}

	return sb.String()
}

// buildFooterElements returns the SVG elements for the footer band.
func buildFooterElements(verified bool, serial int64, accent string) string {
	var sb strings.Builder

	if verified {
		fmt.Fprintf(&sb, "  <circle cx=\"48\" cy=\"557\" r=\"13\" fill=\"%s\" opacity=\"0.82\"/>\n", accent)
		sb.WriteString("  <text x=\"48\" y=\"562\" font-family=\"system-ui,-apple-system,sans-serif\" font-size=\"13\" font-weight=\"700\" fill=\"white\" text-anchor=\"middle\">&#10003;</text>\n")
		sb.WriteString("  <text x=\"70\" y=\"562\" font-family=\"system-ui,-apple-system,sans-serif\" font-size=\"13\" fill=\"rgba(255,255,255,0.80)\">Verified</text>\n")
	}

	if serial > 0 {
		fmt.Fprintf(&sb, "  <text x=\"572\" y=\"562\" font-family=\"system-ui,-apple-system,sans-serif\" font-size=\"13\" fill=\"rgba(255,255,255,0.48)\" text-anchor=\"end\">PVTL #%d</text>\n", serial)
	}

	return sb.String()
}

// xmlEsc escapes the five XML special characters.
func xmlEsc(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, `"`, "&quot;")
	s = strings.ReplaceAll(s, "'", "&#39;")
	return s
}

// nftTruncate truncates a string to max runes, appending … if needed.
func nftTruncate(s string, max int) string {
	r := []rune(s)
	if len(r) <= max {
		return s
	}
	return string(r[:max-1]) + "…"
}
