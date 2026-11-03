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
  const response = await carApi.getCars({ search: chassis.trim(), per_page: 200 });
  return matchCarByChassis(extractCarsFromResponse(response), chassis) ?? null;
}

/** Same message Add Stock List shows when a chassis is already on a car. */
export const CHASSIS_ALREADY_IN_CAR_LIST =
  "This chassis number is already available in the car list.";

/** Returns the stock-list error when this chassis already belongs to a car. */
export async function chassisAlreadyExistsMessage(
  chassis: string
): Promise<string | null> {
  const existing = await findCarByChassis(chassis);
  return existing ? CHASSIS_ALREADY_IN_CAR_LIST : null;
}
