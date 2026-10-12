package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// PhotoStore keeps plant photos in the environment's public bucket, where
// every object is readable at S3_PUBLIC_URL/<key>.
type PhotoStore struct {
	client    *s3.Client
	bucket    string
	publicURL string
}

// newPhotoStore returns nil when no bucket is configured (local runs).
// The SDK reads the key, region and endpoint from the AWS_* variables.
func newPhotoStore(ctx context.Context, cfg Config) (*PhotoStore, error) {
	if cfg.PublicBucket == "" || cfg.PublicURL == "" {
		return nil, nil
	}
	awsCfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, err
	}
	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = true
		o.RequestChecksumCalculation = aws.RequestChecksumCalculationWhenRequired
		o.ResponseChecksumValidation = aws.ResponseChecksumValidationWhenRequired
	})
	return &PhotoStore{client: client, bucket: cfg.PublicBucket,
		publicURL: strings.TrimRight(cfg.PublicURL, "/")}, nil
}

func (s *PhotoStore) URL(key string) string { return s.publicURL + "/" + key }

// Put stores an image under a fresh key for the plant and returns the key.
// Keys are never reused, so the photos can be cached forever.
func (s *PhotoStore) Put(ctx context.Context, plantID int64, contentType string, data []byte) (string, error) {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	key := fmt.Sprintf("plants/%d/%s%s", plantID, hex.EncodeToString(b), imageExt[contentType])
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          bytes.NewReader(data),
		ContentLength: aws.Int64(int64(len(data))),
		ContentType:   aws.String(contentType),
		CacheControl:  aws.String("public, max-age=31536000, immutable"),
	})
	return key, err
}

// deleteQuietly removes a replaced photo; a failure only leaves an orphan.
func (s *PhotoStore) deleteQuietly(ctx context.Context, key string) {
	if s == nil || key == "" {
		return
	}
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket), Key: aws.String(key)})
	if err != nil {
		log.Printf("delete photo %s: %v", key, err)
	}
}

var imageExt = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}
