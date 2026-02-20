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
// The design follows Meridian brand guidelines: dark navy background, blue accent,
// Montserrat font, and the three-parallelogram logo mark.
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

// buildListingNFTSVG generates a 600×600 on-brand SVG certificate for a listing NFT.
//
// Brand colours: navy #0E2140 background, blue #2563EB accent, white text.
// The three-parallelogram Meridian mark is reproduced in SVG at the top.
// A large faded watermark of the same mark sits behind the content for depth.
// Three subtle navy-blue circles (derived from the listing UUID) give each NFT
// a unique background texture while keeping the palette consistent.
func buildListingNFTSVG(id uuid.UUID, name, category, askingRange, location string, verified bool, serial int64) string {
	decoration := buildCertDecoration(id)
	displayName := nftTruncate(name, 22)

	metaLine := xmlEsc(category)
	if location != "" {
		metaLine += "  ·  " + xmlEsc(location)
	}

	var askEl string
	if askingRange != "" {
		askEl = fmt.Sprintf(
			`  <text x="300" y="428" font-family="Montserrat,system-ui,sans-serif" font-size="18" font-weight="600" fill="#93c5fd" text-anchor="middle">%s</text>`,
			xmlEsc(askingRange),
		)
	}

	footerEls := buildNFTFooter(verified, serial)

	// meridianMark returns the three-parallelogram SVG group in local coordinates
	// (bounding box 0 0 50 72). Caller must wrap in a <g transform="..."> to position.
	const meridianMark = `
    <polygon points="0,72 13,72 18,18 5,33" fill="white"/>
    <polygon points="18,72 32,72 32,0 18,9" fill="white"/>
    <polygon points="37,72 50,72 50,22 37,36" fill="white"/>`

	return fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <style><![CDATA[@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');]]></style>
  </defs>

  <!-- ── Background ── -->
  <rect width="600" height="600" fill="#0E2140"/>

  <!-- ── UUID-derived depth blobs (unique per listing, subtle) ── -->
%s

  <!-- ── Large watermark mark (centre, very faint) ── -->
  <g transform="translate(232,180) scale(2.7)" opacity="0.04" fill="white">%s
  </g>

  <!-- ── Outer frame ── -->
  <rect x="14" y="14" width="572" height="572" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>

  <!-- ── Corner brackets ── -->
  <path d="M24,72 L24,24 L72,24"   fill="none" stroke="#2563EB" stroke-width="1.5" opacity="0.55"/>
  <path d="M528,24 L576,24 L576,72" fill="none" stroke="#2563EB" stroke-width="1.5" opacity="0.55"/>
  <path d="M24,528 L24,576 L72,576" fill="none" stroke="#2563EB" stroke-width="1.5" opacity="0.55"/>
  <path d="M576,528 L576,576 L528,576" fill="none" stroke="#2563EB" stroke-width="1.5" opacity="0.55"/>

  <!-- ── Logo mark ── -->
  <g transform="translate(275,44)" opacity="0.94" fill="white">%s
  </g>

  <!-- ── MERIDIAN wordmark ── -->
  <text x="300" y="136"
    font-family="Montserrat,system-ui,sans-serif"
    font-size="21" font-weight="700" letter-spacing="5"
    fill="white" text-anchor="middle">MERIDIAN</text>

  <!-- ── MARKETS sub-label ── -->
  <text x="300" y="155"
    font-family="Montserrat,system-ui,sans-serif"
    font-size="9" font-weight="600" letter-spacing="7"
    fill="rgba(255,255,255,0.36)" text-anchor="middle">MARKETS</text>

  <!-- ── Divider with diamond ── -->
  <line x1="40"  y1="178" x2="272" y2="178" stroke="#2563EB" stroke-width="1" opacity="0.42"/>
  <polygon points="300,171 307,178 300,185 293,178" fill="#2563EB" opacity="0.68"/>
  <line x1="328" y1="178" x2="560" y2="178" stroke="#2563EB" stroke-width="1" opacity="0.42"/>

  <!-- ── ACQUISITION label ── -->
  <text x="300" y="228"
    font-family="Montserrat,system-ui,sans-serif"
    font-size="10" font-weight="600" letter-spacing="7"
    fill="rgba(255,255,255,0.36)" text-anchor="middle">ACQUISITION</text>

  <!-- ── CERTIFICATE heading ── -->
  <text x="300" y="270"
    font-family="Montserrat,system-ui,sans-serif"
    font-size="36" font-weight="800" letter-spacing="2"
    fill="white" text-anchor="middle">CERTIFICATE</text>

  <!-- ── Accent rule under heading ── -->
  <line x1="120" y1="286" x2="480" y2="286" stroke="#2563EB" stroke-width="1.5" opacity="0.5"/>

  <!-- ── Business name ── -->
  <text x="300" y="358"
    font-family="Montserrat,system-ui,sans-serif"
    font-size="26" font-weight="700"
    fill="white" text-anchor="middle">%s</text>

  <!-- ── Category · Location ── -->
  <text x="300" y="390"
    font-family="Montserrat,system-ui,sans-serif"
    font-size="13" fill="rgba(255,255,255,0.48)" text-anchor="middle">%s</text>

  <!-- ── Asking range ── -->
%s

  <!-- ── Footer separator ── -->
  <line x1="30" y1="518" x2="570" y2="518" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

  <!-- ── Footer: verified badge + serial ── -->
%s
</svg>`,
		decoration,
		meridianMark,
		meridianMark,
		xmlEsc(displayName),
		metaLine,
		askEl,
		footerEls,
	)
}

// buildCertDecoration returns three subtly lighter-navy circles whose position and
// size are derived deterministically from the listing UUID. They sit behind all
// content at low opacity, giving each certificate a unique but brand-consistent feel.
func buildCertDecoration(id uuid.UUID) string {
	var sb strings.Builder
	params := [3][3]int{
		{40 + int(id[0])%220, 140 + int(id[1])%260, 90 + int(id[2])%120},
		{200 + int(id[3])%200, 180 + int(id[4])%220, 70 + int(id[5])%140},
		{320 + int(id[6])%240, 150 + int(id[7])%270, 80 + int(id[8])%130},
	}
	for _, p := range params {
		fmt.Fprintf(&sb,
			"  <circle cx=\"%d\" cy=\"%d\" r=\"%d\" fill=\"#1a3a6b\" opacity=\"0.32\"/>\n",
			p[0], p[1], p[2])
	}
	return sb.String()
}

// buildNFTFooter returns the footer SVG elements: a verified badge on the left
// and the PVTL serial number on the right.
func buildNFTFooter(verified bool, serial int64) string {
	var sb strings.Builder
	if verified {
		sb.WriteString("  <circle cx=\"48\" cy=\"558\" r=\"13\" fill=\"#2563EB\" opacity=\"0.85\"/>\n")
		sb.WriteString("  <text x=\"48\" y=\"563\" font-family=\"Montserrat,system-ui,sans-serif\" font-size=\"12\" font-weight=\"700\" fill=\"white\" text-anchor=\"middle\">&#10003;</text>\n")
		sb.WriteString("  <text x=\"70\" y=\"563\" font-family=\"Montserrat,system-ui,sans-serif\" font-size=\"12\" fill=\"rgba(255,255,255,0.72)\">Verified</text>\n")
	}
	if serial > 0 {
		fmt.Fprintf(&sb,
			"  <text x=\"572\" y=\"563\" font-family=\"Montserrat,system-ui,sans-serif\" font-size=\"12\" fill=\"rgba(255,255,255,0.40)\" text-anchor=\"end\">PVTL #%d</text>\n",
			serial)
	}
	return sb.String()
}

// xmlEsc escapes the five XML special characters for safe SVG text embedding.
func xmlEsc(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, `"`, "&quot;")
	s = strings.ReplaceAll(s, "'", "&#39;")
	return s
}

// nftTruncate truncates to max runes, appending … if needed.
func nftTruncate(s string, max int) string {
	r := []rune(s)
	if len(r) <= max {
		return s
	}
	return string(r[:max-1]) + "…"
}
