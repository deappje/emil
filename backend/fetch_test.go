package main

import "testing"

func TestPublicOnly(t *testing.T) {
	blocked := []string{"127.0.0.1:80", "10.0.0.5:443", "192.168.1.1:80", "172.16.0.1:80",
		"169.254.169.254:80", "100.64.0.1:80", "[::1]:80", "[fd00::1]:80", "[::ffff:10.0.0.1]:80", "0.0.0.0:80"}
	for _, addr := range blocked {
		if publicOnly("tcp", addr, nil) == nil {
			t.Errorf("%s should be blocked", addr)
		}
	}
	for _, addr := range []string{"93.184.215.14:443", "[2606:4700::1]:443"} {
		if err := publicOnly("tcp", addr, nil); err != nil {
			t.Errorf("%s should be allowed: %v", addr, err)
		}
	}
}

func TestNormalize(t *testing.T) {
	min, max := 150, 80
	p := Plant{Name: "  Test ", Type: "boom", Lifecycle: "meerjarig", HeightMin: &min, HeightMax: &max,
		Sun: []string{"schaduw", "zon", "maan", "zon"}, BloomMonths: []int{13, 5, 0, 5}}
	if err := p.normalize(); err != nil {
		t.Fatal(err)
	}
	if p.Name != "Test" || *p.HeightMin != 80 || *p.HeightMax != 150 {
		t.Errorf("normalize: %+v", p)
	}
	if len(p.Sun) != 2 || p.Sun[0] != "zon" || len(p.BloomMonths) != 1 {
		t.Errorf("lists: %v %v", p.Sun, p.BloomMonths)
	}
	if (&Plant{Name: "x", Type: "rots", Lifecycle: "meerjarig"}).normalize() == nil {
		t.Error("unknown type should fail")
	}
}
