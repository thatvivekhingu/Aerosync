"""
models/solar_tax_engine.py
==========================
Solar Rooftop Energy Potential & Gram Panchayat Property Tax Valuation Engine.
Derived from Ministry of New and Renewable Energy (MNRE) guidelines and rural local body tax codes.

Enables:
1. Solar Rooftop Potential Calculation:
   - Usable rooftop shadow-free area (m²)
   - PV panel capacity (kWp)
   - Annual solar energy yield (kWh / year)
   - Annual carbon footprint reduction (kg CO2 / year)
   - Annual household electricity bill savings (₹ INR)
2. Gram Panchayat Property Tax & Asset Valuation:
   - Base circle rate valuation by construction class (Pakka RCC vs Semi-Pakka Tin vs Kachha)
   - Annual local body property tax computation
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Union

from .roof_material import RoofMaterial


@dataclass
class SolarPotentialReport:
    total_roof_area_sqm: float
    usable_solar_area_sqm: float
    recommended_capacity_kwp: float
    annual_generation_kwh: float
    annual_co2_savings_kg: float
    annual_savings_inr: float
    suitability_rating: str


@dataclass
class PropertyValuationReport:
    total_area_sqm: float
    construction_type: str
    circle_rate_per_sqm: float
    estimated_asset_value_inr: float
    annual_property_tax_inr: float
    tax_bracket: str


class SolarPotentialCalculator:
    """Calculates solar potential according to Indian solar irradiation standards (~1450 kWh/kWp/year)."""

    # Usable shadow-free fraction based on roof type
    USABLE_FRACTION = {
        RoofMaterial.RCC_CONCRETE.value: 0.75,       # Flat RCC roof - optimal for tilted arrays
        RoofMaterial.TIN_CORRUGATED_SHEET.value: 0.85,# Sloped metal roof - easy mounting
        RoofMaterial.TILED_TERRACOTTA.value: 0.50,   # Sloped clay tiles - fragile mounting
        RoofMaterial.THATCH_KACHHA.value: 0.00,      # Unsuitable structural load
    }

    # SQM per kWp (Standard high-efficiency mono-perc panels require ~7.0 sqm per kWp)
    SQM_PER_KWP = 7.0

    # Specific annual yield in kWh/kWp in rural India
    SPECIFIC_YIELD_KWH_PER_KWP = 1450.0

    # Grid CO2 emission factor in India: ~0.82 kg CO2 / kWh
    CO2_FACTOR_KG_PER_KWH = 0.82

    # Average domestic rural power tariff in INR: ₹ 6.20 / kWh
    ELECTRICITY_TARIFF_INR_PER_KWH = 6.20

    def compute_solar_potential(
        self,
        roof_area_sqm: float,
        roof_material: Union[RoofMaterial, str] = RoofMaterial.RCC_CONCRETE,
    ) -> SolarPotentialReport:
        mat_str = roof_material.value if isinstance(roof_material, RoofMaterial) else str(roof_material)
        usable_fraction = self.USABLE_FRACTION.get(mat_str, 0.70)

        usable_area = roof_area_sqm * usable_fraction
        if usable_area < 10.0:  # Minimum 1.5 kW system threshold
            return SolarPotentialReport(
                total_roof_area_sqm=round(roof_area_sqm, 2),
                usable_solar_area_sqm=round(usable_area, 2),
                recommended_capacity_kwp=0.0,
                annual_generation_kwh=0.0,
                annual_co2_savings_kg=0.0,
                annual_savings_inr=0.0,
                suitability_rating="LOW / UNSUITABLE",
            )

        capacity_kwp = usable_area / self.SQM_PER_KWP
        annual_gen_kwh = capacity_kwp * self.SPECIFIC_YIELD_KWH_PER_KWP
        co2_savings_kg = annual_gen_kwh * self.CO2_FACTOR_KG_PER_KWH
        annual_savings_inr = annual_gen_kwh * self.ELECTRICITY_TARIFF_INR_PER_KWH

        suitability = "EXCELLENT" if capacity_kwp >= 5.0 else ("GOOD" if capacity_kwp >= 2.0 else "MODERATE")

        return SolarPotentialReport(
            total_roof_area_sqm=round(roof_area_sqm, 2),
            usable_solar_area_sqm=round(usable_area, 2),
            recommended_capacity_kwp=round(capacity_kwp, 2),
            annual_generation_kwh=round(annual_gen_kwh, 1),
            annual_co2_savings_kg=round(co2_savings_kg, 1),
            annual_savings_inr=round(annual_savings_inr, 2),
            suitability_rating=suitability,
        )


class GramPanchayatTaxCalculator:
    """Calculates property valuation and Gram Panchayat local tax assessment."""

    # Circle rates per sqm by roof/structure grade in INR
    CONSTRUCTION_RATES = {
        RoofMaterial.RCC_CONCRETE.value: 12500.0,      # Pakka RCC
        RoofMaterial.TIN_CORRUGATED_SHEET.value: 7500.0,# Semi-Pakka Tin
        RoofMaterial.TILED_TERRACOTTA.value: 6000.0,   # Traditional Tiled
        RoofMaterial.THATCH_KACHHA.value: 2500.0,      # Kachha Mud/Grass
    }

    # Annual property tax rate percentage (e.g. 0.15% of circle rate valuation in rural bodies)
    TAX_RATE = 0.0015

    def compute_valuation_and_tax(
        self,
        built_up_area_sqm: float,
        roof_material: Union[RoofMaterial, str] = RoofMaterial.RCC_CONCRETE,
    ) -> PropertyValuationReport:
        mat_str = roof_material.value if isinstance(roof_material, RoofMaterial) else str(roof_material)
        rate_per_sqm = self.CONSTRUCTION_RATES.get(mat_str, 8000.0)

        asset_value = built_up_area_sqm * rate_per_sqm
        tax = asset_value * self.TAX_RATE

        if asset_value > 2000000:
            bracket = "CLASS_A_RESIDENTIAL"
        elif asset_value > 1000000:
            bracket = "CLASS_B_RESIDENTIAL"
        else:
            bracket = "CLASS_C_RURAL_AFFORDABLE"

        return PropertyValuationReport(
            total_area_sqm=round(built_up_area_sqm, 2),
            construction_type=mat_str,
            circle_rate_per_sqm=rate_per_sqm,
            estimated_asset_value_inr=round(asset_value, 2),
            annual_property_tax_inr=round(tax, 2),
            tax_bracket=bracket,
        )
