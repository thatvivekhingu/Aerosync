import { NextResponse } from "next/server";

export interface SatelliteSceneData {
  id: string;
  name: string;
  source: string;
  gsd_m: number;
  location: string;
  modes: {
    farseg_segmentation: {
      title: "FarSeg Foreground-Aware Segmentation";
      classes: { name: string; color: string; coverage_pct: number }[];
      miou: number;
    };
    oriented_detection: {
      title: "Oriented Bounding Box (OBB) Detector";
      detections: { id: string; label: string; angle_deg: number; confidence: number; length_m: number; width_m: number }[];
    };
    pansharpening: {
      title: "Deep PanNet Residual Pansharpening (MS + PAN)";
      resolution_boost: "4x High-Frequency Detail";
      sam_degrees: number;
      ergas_score: number;
      spectral_fidelity: string;
    };
    cloud_masking: {
      title: "CloudShadowNet Atmospheric Masking";
      clear_ground_pct: number;
      thick_cloud_pct: number;
      cirrus_haze_pct: number;
      shadow_pct: number;
      quality_status: string;
    };
    foundation_embeddings: {
      title: "GeoFoundation ViT Semantic Embeddings";
      embedding_dim: number;
      cosine_similarity_top_match: number;
      top_category: string;
    };
  };
}

const SAMPLE_SATELLITE_SCENES: SatelliteSceneData[] = [
  {
    id: "scene_euro_01",
    name: "Sentinel-2 & WorldView-3 Urban Ag Corridor",
    source: "Sentinel-2 L2A (10m) + WorldView-3 PAN (0.3m)",
    gsd_m: 0.3,
    location: "National Capital Region (NCR) Peri-Urban Fringe",
    modes: {
      farseg_segmentation: {
        title: "FarSeg Foreground-Aware Segmentation",
        classes: [
          { name: "Building Plinths", color: "#ff9800", coverage_pct: 28.4 },
          { name: "Agricultural Fields", color: "#4caf50", coverage_pct: 44.1 },
          { name: "Water Canal", color: "#0284c7", coverage_pct: 12.5 },
          { name: "Access Road Network", color: "#64748b", coverage_pct: 15.0 },
        ],
        miou: 91.8,
      },
      oriented_detection: {
        title: "Oriented Bounding Box (OBB) Detector",
        detections: [
          { id: "OBB-101", label: "Rotated Warehouse", angle_deg: 34.2, confidence: 0.96, length_m: 42.5, width_m: 22.0 },
          { id: "OBB-102", label: "Solar Rooftop Array", angle_deg: -18.7, confidence: 0.94, length_m: 35.0, width_m: 14.8 },
          { id: "OBB-103", label: "Commercial Facility", angle_deg: 41.0, confidence: 0.92, length_m: 56.2, width_m: 28.4 },
          { id: "OBB-104", label: "Agricultural Polyhouse", angle_deg: -12.5, confidence: 0.89, length_m: 48.0, width_m: 18.0 },
        ],
      },
      pansharpening: {
        title: "Deep PanNet Residual Pansharpening (MS + PAN)",
        resolution_boost: "4x High-Frequency Detail",
        sam_degrees: 2.14,
        ergas_score: 1.87,
        spectral_fidelity: "98.7% Radiometric Preservation",
      },
      cloud_masking: {
        title: "CloudShadowNet Atmospheric Masking",
        clear_ground_pct: 94.2,
        thick_cloud_pct: 0.0,
        cirrus_haze_pct: 4.1,
        shadow_pct: 1.7,
        quality_status: "PASSED — Valid for Automated Cadastral Ingestion",
      },
      foundation_embeddings: {
        title: "GeoFoundation ViT Semantic Embeddings",
        embedding_dim: 256,
        cosine_similarity_top_match: 0.942,
        top_category: "Mixed Peri-Urban Settlement & Solar Grid",
      },
    },
  },
  {
    id: "scene_euro_02",
    name: "Coastal Port & Renewable Solar Basin",
    source: "PlanetScope SuperDove (3m) + Pléiades Neo (0.3m)",
    gsd_m: 0.3,
    location: "Coastal Gujarat Maritime & Renewable Corridor",
    modes: {
      farseg_segmentation: {
        title: "FarSeg Foreground-Aware Segmentation",
        classes: [
          { name: "Industrial & Port Facilities", color: "#9333ea", coverage_pct: 32.6 },
          { name: "Ground Solar Farm", color: "#eab308", coverage_pct: 38.2 },
          { name: "Coastal Wetland", color: "#06b6d4", coverage_pct: 19.5 },
          { name: "Internal Logistics Road", color: "#64748b", coverage_pct: 9.7 },
        ],
        miou: 93.4,
      },
      oriented_detection: {
        title: "Oriented Bounding Box (OBB) Detector",
        detections: [
          { id: "OBB-201", label: "Docked Cargo Vessel", angle_deg: 62.4, confidence: 0.98, length_m: 110.0, width_m: 24.5 },
          { id: "OBB-202", label: "Tilted Ground Solar Block A", angle_deg: -25.0, confidence: 0.97, length_m: 85.0, width_m: 45.0 },
          { id: "OBB-203", label: "Tilted Ground Solar Block B", angle_deg: -25.0, confidence: 0.96, length_m: 85.0, width_m: 45.0 },
          { id: "OBB-204", label: "Oil Storage Tank", angle_deg: 0.0, confidence: 0.95, length_m: 30.0, width_m: 30.0 },
        ],
      },
      pansharpening: {
        title: "Deep PanNet Residual Pansharpening (MS + PAN)",
        resolution_boost: "4x High-Frequency Detail",
        sam_degrees: 1.95,
        ergas_score: 1.62,
        spectral_fidelity: "99.1% Radiometric Preservation",
      },
      cloud_masking: {
        title: "CloudShadowNet Atmospheric Masking",
        clear_ground_pct: 97.8,
        thick_cloud_pct: 0.0,
        cirrus_haze_pct: 1.5,
        shadow_pct: 0.7,
        quality_status: "OPTIMAL — Zero Cloud Occlusion Detected",
      },
      foundation_embeddings: {
        title: "GeoFoundation ViT Semantic Embeddings",
        embedding_dim: 256,
        cosine_similarity_top_match: 0.968,
        top_category: "Maritime Logistics & High-Density Solar Facility",
      },
    },
  },
];

export async function GET() {
  return NextResponse.json({
    status: "ok",
    engines: {
      drone_master: {
        name: "UnifiedAeroSyncDroneEngine",
        version: "v2.6 Enterprise",
        modules: [
          "Attention ResUNet / UNet++ Cadastral Regularization",
          "Siamese Difference Bi-Temporal Change Detection",
          "Promptable Zero-Shot SAM Segmenter",
          "Sub-Pixel SISR 4x Super-Resolution",
          "Rooftop Material Classifier & Grad-CAM XAI",
        ],
      },
      satellite_master: {
        name: "UnifiedSatelliteFoundationEngine",
        version: "v1.0 Techniques Suite",
        modules: [
          "FarSeg Foreground-Aware Wide Area Segmentation",
          "Oriented Bounding Box (OBB) Rotated Object Detector",
          "Deep PanNet MS + PAN Residual Pansharpening",
          "CloudShadowNet Atmospheric Cloud & Shadow Masking",
          "GeoFoundation Vision Transformer (GeoViT) Semantic Embeddings",
        ],
      },
    },
    satellite_scenes: SAMPLE_SATELLITE_SCENES,
  });
}
