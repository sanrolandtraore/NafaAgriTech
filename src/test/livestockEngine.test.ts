import { describe, it, expect } from "vitest";
import {
  calculateFatteningPlan,
  calculateLayerProduction,
  calculateBroilerBatch,
  getGestationPeriodDays,
  calculateExpectedBirthDate,
  calculateSahelianWaterNeeds,
} from "../lib/livestockEngine";

describe("Livestock Zootechnic Engine", () => {
  describe("Cattle & Sheep Fattening (Embouche)", () => {
    it("calculates 10 bovines over 90 days with 800g/day GMQ", () => {
      const res = calculateFatteningPlan({
        species: "bovin",
        headCount: 10,
        durationDays: 90,
        initialWeightKg: 250,
        targetGmqGrams: 800,
        purchasePricePerHead: 200000,
        dailyFeedCostPerHead: 800,
        healthCostPerHead: 5000,
        sellingPricePerKgLive: 1500,
      });

      // Gain = (800g * 90) / 1000 = 72 kg -> Final weight = 322 kg
      expect(res.weightGainPerHeadKg).toBe(72);
      expect(res.finalWeightKg).toBe(322);
      expect(res.totalWeightGainKg).toBe(720);

      // Costs
      expect(res.totalPurchaseCost).toBe(2000000); // 10 * 200 000
      expect(res.totalFeedCost).toBe(720000); // 10 * 90 * 800
      expect(res.totalHealthCost).toBe(50000); // 10 * 5000
      expect(res.totalInvestment).toBe(2770000);

      // Revenue: 322 kg * 1500 = 483 000 FCFA/head -> 4 830 000 FCFA
      expect(res.estimatedSellingPricePerHead).toBe(483000);
      expect(res.totalRevenue).toBe(4830000);

      // Net margin & ROI
      expect(res.netMargin).toBe(2060000);
      expect(res.marginPerHead).toBe(206000);
      expect(res.roiPercent).toBeCloseTo(74.37, 1);
    });
  });

  describe("Poultry Layers (Pondeuses)", () => {
    it("calculates production for 500 laying hens at 80% laying rate", () => {
      const res = calculateLayerProduction({
        henCount: 500,
        layingRatePercent: 80,
        eggTrayPriceFcfa: 2200,
        dailyFeedGramsPerHen: 120,
        feedKgPriceFcfa: 350,
        veterinaryMonthlyCostPerHen: 100,
      });

      // Daily: 500 * 0.8 = 400 eggs = 13.3 trays
      expect(res.dailyEggs).toBe(400);
      expect(res.dailyTrays).toBe(13.3);

      // Monthly: 12 000 eggs = 400 trays * 2200 = 880 000 FCFA
      expect(res.monthlyEggs).toBe(12000);
      expect(res.monthlyTrays).toBe(400);
      expect(res.monthlyRevenueFcfa).toBe(880000);

      // Feed: 500 * 0.12 = 60 kg/day -> 1800 kg/month * 350 = 630 000 FCFA
      expect(res.dailyFeedKg).toBe(60);
      expect(res.monthlyFeedKg).toBe(1800);
      expect(res.monthlyFeedCostFcfa).toBe(630000);

      // Health: 500 * 100 = 50 000 FCFA
      expect(res.monthlyHealthCostFcfa).toBe(50000);
      expect(res.monthlyTotalCostFcfa).toBe(680000);

      // Net profit = 880 000 - 680 000 = 200 000 FCFA
      expect(res.monthlyNetProfitFcfa).toBe(200000);
      expect(res.profitPerHenMonthlyFcfa).toBe(400);
    });
  });

  describe("Broilers Batch (Poulets de chair)", () => {
    it("calculates a batch of 500 broilers with 4% mortality and 1.85 FCR", () => {
      const res = calculateBroilerBatch({
        batchSize: 500,
        mortalityRatePercent: 4,
        targetWeightKg: 2.0,
        feedConversionRatio: 1.85,
        chickUnitPriceFcfa: 500,
        feedKgAvgPriceFcfa: 400,
        healthCostPerChickenFcfa: 150,
        sellingPricePerChickenFcfa: 2500,
      });

      // Surviving: 500 * 0.96 = 480 chickens
      expect(res.survivingChickens).toBe(480);
      expect(res.totalLiveWeightKg).toBe(960); // 480 * 2 kg
      expect(res.totalFeedKg).toBe(1776); // 960 * 1.85
      expect(res.totalFeedBags50kg).toBe(36); // ceil(1776 / 50)

      // Costs: 250k (chicks) + 710.4k (feed) + 75k (health) = 1 035 400 FCFA
      expect(res.chicksCostFcfa).toBe(250000);
      expect(res.feedCostFcfa).toBe(710400);
      expect(res.healthCostFcfa).toBe(75000);
      expect(res.totalCostFcfa).toBe(1035400);

      // Revenue: 480 * 2500 = 1 200 000 FCFA
      expect(res.grossRevenueFcfa).toBe(1200000);

      // Margin: 1 200 000 - 1 035 400 = 164 600 FCFA
      expect(res.netMarginFcfa).toBe(164600);
      expect(res.marginPerChickenFcfa).toBe(343);
      expect(res.roiPercent).toBeCloseTo(15.9, 1);
    });
  });

  describe("Gestation & Birth Calculator", () => {
    it("returns correct gestation duration per species", () => {
      expect(getGestationPeriodDays("bovin")).toBe(283);
      expect(getGestationPeriodDays("ovin")).toBe(150);
      expect(getGestationPeriodDays("caprin")).toBe(150);
      expect(getGestationPeriodDays("porcin")).toBe(114);
      expect(getGestationPeriodDays("volaille")).toBe(21);
      expect(getGestationPeriodDays("inconnu")).toBe(150); // fallback
    });

    it("projects accurate birth dates", () => {
      // 2026-01-01 + 283 days = 2026-10-11
      const cowBirth = calculateExpectedBirthDate("2026-01-01", "bovin");
      expect(cowBirth).toBe("2026-10-11");

      // 2026-01-01 + 150 days = 2026-05-31
      const sheepBirth = calculateExpectedBirthDate("2026-01-01", "ovin");
      expect(sheepBirth).toBe("2026-05-31");
    });
  });

  describe("Sahelian Water Requirements", () => {
    it("calculates daily and monthly water needs in normal and hot dry seasons", () => {
      // 20 cattle in normal season (45L/head/day)
      const normalCattle = calculateSahelianWaterNeeds({ species: "bovin", headCount: 20, isHotDrySeason: false });
      expect(normalCattle.dailyPerHeadLiters).toBe(45);
      expect(normalCattle.dailyTotalLiters).toBe(900);
      expect(normalCattle.monthlyTotalLiters).toBe(27000);

      // 20 cattle in hot dry season (70L/head/day)
      const dryCattle = calculateSahelianWaterNeeds({ species: "bovin", headCount: 20, isHotDrySeason: true });
      expect(dryCattle.dailyPerHeadLiters).toBe(70);
      expect(dryCattle.dailyTotalLiters).toBe(1400);
      expect(dryCattle.monthlyTotalLiters).toBe(42000);

      // 500 chickens in hot dry season (0.35L/bird/day)
      const chickens = calculateSahelianWaterNeeds({ species: "volaille", headCount: 500, isHotDrySeason: true });
      expect(chickens.dailyPerHeadLiters).toBe(0.35);
      expect(chickens.dailyTotalLiters).toBe(175);
    });
  });
});

