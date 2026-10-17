const MAX_ENERGY = 5;

const REFILL_TIME = 30 * 60 * 1000; // 60 minutes

const ENERGY_KEY = "lumilex_energy";
const LAST_REFILL_KEY = "lumilex_last_energy_refill";


// Get current energy
export const getEnergy = () => {
  const storedEnergy = localStorage.getItem(ENERGY_KEY);

  // First time
  if (storedEnergy === null) {
    localStorage.setItem(
      ENERGY_KEY,
      MAX_ENERGY
    );

    localStorage.setItem(
      LAST_REFILL_KEY,
      Date.now()
    );

    return MAX_ENERGY;
  }

  return Number(storedEnergy);
};


// Update energy based on elapsed time
export const updateEnergy = () => {
  let energy = getEnergy();

  const lastRefill = Number(
    localStorage.getItem(LAST_REFILL_KEY)
  );

  if (!lastRefill) {
    localStorage.setItem(
      LAST_REFILL_KEY,
      Date.now()
    );

    return energy;
  }

  // Already full
  if (energy >= MAX_ENERGY) {
    return MAX_ENERGY;
  }

  const now = Date.now();

  const elapsed =
    now - lastRefill;

  const refills = Math.floor(
    elapsed / REFILL_TIME
  );

  if (refills > 0) {

    const newEnergy = Math.min(
      MAX_ENERGY,
      energy + refills
    );

    localStorage.setItem(
      ENERGY_KEY,
      newEnergy
    );

    localStorage.setItem(
      LAST_REFILL_KEY,
      lastRefill +
        refills * REFILL_TIME
    );

    energy = newEnergy;
  }

  return energy;
};


// Use energy
export const useEnergy = (amount = 1) => {

  const currentEnergy =
    updateEnergy();

  if (currentEnergy < amount) {
    return false;
  }

  const newEnergy =
    currentEnergy - amount;

  localStorage.setItem(
    ENERGY_KEY,
    newEnergy
  );

  /*
    Start the refill timer when
    energy goes down from maximum.
  */

  if (currentEnergy === MAX_ENERGY) {
    localStorage.setItem(
      LAST_REFILL_KEY,
      Date.now()
    );
  }

  return true;
};


// Add bonus energy
export const addEnergy = (amount = 1) => {

  const currentEnergy =
    updateEnergy();

  const newEnergy = Math.min(
    MAX_ENERGY,
    currentEnergy + amount
  );

  localStorage.setItem(
    ENERGY_KEY,
    newEnergy
  );

  return newEnergy;
};


// Maximum energy
export const getMaxEnergy = () => {
  return MAX_ENERGY;
};


// Time until next energy
export const getTimeUntilNextEnergy = () => {

  const energy =
    updateEnergy();

  if (energy >= MAX_ENERGY) {
    return 0;
  }

  const lastRefill = Number(
    localStorage.getItem(
      LAST_REFILL_KEY
    )
  );

  if (!lastRefill) {
    return REFILL_TIME;
  }

  const nextRefillTime =
    lastRefill + REFILL_TIME;

  return Math.max(
    0,
    nextRefillTime - Date.now()
  );
};