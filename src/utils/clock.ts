type AddTimeParams = {
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
  from?: Date;
};

export function addTime({
  seconds = 0,
  minutes = 0,
  hours = 0,
  days = 0,
  from = new Date(),
}: AddTimeParams): Date {
  const ms =
    seconds * 1000 + minutes * 60 * 1000 + hours * 60 * 60 * 1000 + days * 24 * 60 * 60 * 1000;

  return new Date(from.getTime() + ms);
}
