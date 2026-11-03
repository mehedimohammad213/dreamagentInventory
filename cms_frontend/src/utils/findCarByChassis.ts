import { carApi, Car, CarResponse } from "@/services/carApi";
import { purchaseHistoryApi } from "@/services/purchaseHistoryApi";

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

/** LC numbers linked to this car through purchase history. */
export async function findLcNumbersForCar(carId: number): Promise<string[]> {
  const response = await purchaseHistoryApi.getPurchaseHistories({
    car_id: carId,
    per_page: 100,
    sort_by: "created_at",
    sort_order: "desc",
  });
  const labels = (response.data || [])
    .map((row) => row.lc_number?.trim())
    .filter((value): value is string => Boolean(value));
  return Array.from(new Set(labels));
}

/** Returns the stock-list error when this chassis already belongs to a car. */
export async function chassisAlreadyExistsMessage(
  chassis: string
): Promise<string | null> {
  const existing = await findCarByChassis(chassis);
  return existing ? CHASSIS_ALREADY_IN_CAR_LIST : null;
}

/**
 * Purchase create popup: if chassis exists, show its LC name when available.
 */
export async function chassisAlreadyExistsPurchaseMessage(
  chassis: string
): Promise<string | null> {
  const existing = await findCarByChassis(chassis);
  if (!existing) return null;

  const lcNumbers = await findLcNumbersForCar(existing.id);
  if (lcNumbers.length === 1) {
    return `This chassis number is already under LC ${lcNumbers[0]}.`;
  }
  if (lcNumbers.length > 1) {
    return `This chassis number is already under LC ${lcNumbers.join(", ")}.`;
  }

  return CHASSIS_ALREADY_IN_CAR_LIST;
}
