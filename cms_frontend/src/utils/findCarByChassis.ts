import { carApi, Car, CarResponse } from "@/services/carApi";

export function extractCarsFromResponse(response: CarResponse): Car[] {
  const cars = response.data?.data || response.data?.cars || [];
  return Array.isArray(cars) ? cars : [];
}

export function matchCarByChassis(cars: Car[], chassis: string): Car | undefined {
  const cleaned = chassis.trim().toLowerCase();
  return cars.find(
    (c) =>
      c.chassis_no_full?.trim().toLowerCase() === cleaned ||
      c.chassis_no_masked?.trim().toLowerCase() === cleaned ||
      c.ref_no?.trim().toLowerCase() === cleaned
  );
}

export async function findCarByChassis(chassis: string): Promise<Car | null> {
  const response = await carApi.getCars({ search: chassis.trim() });
  return matchCarByChassis(extractCarsFromResponse(response), chassis) ?? null;
}
