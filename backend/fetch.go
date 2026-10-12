package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/netip"
	"syscall"
	"time"
)

var errBlockedAddress = errors.New("adres niet toegestaan")

// cgnat is shared address space (RFC 6598), used inside some clusters.
var cgnat = netip.MustParsePrefix("100.64.0.0/10")

// publicOnly refuses connections to anything but public unicast addresses,
// so an imported photo link cannot reach the cluster's own services. It
// runs on the resolved address, which also defeats DNS rebinding.
func publicOnly(_, address string, _ syscall.RawConn) error {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return err
	}
	ip, err := netip.ParseAddr(host)
	if err != nil {
		return errBlockedAddress
	}
	ip = ip.Unmap()
	if !ip.IsGlobalUnicast() || ip.IsPrivate() || ip.IsLoopback() || cgnat.Contains(ip) {
		return errBlockedAddress
	}
	return nil
}

var fetchClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		Proxy:                 nil,
		DialContext:           (&net.Dialer{Timeout: 10 * time.Second, Control: publicOnly}).DialContext,
		TLSHandshakeTimeout:   10 * time.Second,
		ResponseHeaderTimeout: 20 * time.Second,
		MaxIdleConnsPerHost:   4,
	},
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) >= 3 {
			return errors.New("te veel doorverwijzingen")
		}
		return nil
	},
}

// fetchImage downloads an image of at most maxPhotoBytes from a public
// http(s) address and returns it with its sniffed content type.
func fetchImage(ctx context.Context, url string) ([]byte, string, error) {
	if !isHTTPURL(url) {
		return nil, "", errors.New("geen http(s)-adres")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("User-Agent", "Plantengids/1.0 (foto-import)")
	resp, err := fetchClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("status %d", resp.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, maxPhotoBytes+1))
	if err != nil {
		return nil, "", err
	}
	if len(data) > maxPhotoBytes {
		return nil, "", errors.New("groter dan 10 MB")
	}
	contentType := http.DetectContentType(data)
	if imageExt[contentType] == "" {
		return nil, "", errors.New("geen afbeelding")
	}
	return data, contentType, nil
}
