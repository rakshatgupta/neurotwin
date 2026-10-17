export type DemoModel = {
  features: string[]; means: number[]; scales: number[];
  coefficients: number[]; intercept: number;
};

// Uses the exact StandardScaler -> Ridge formula exported by the notebook.
export function predictDemo(model: DemoModel, inputs: Record<string, number>) {
  const size = model.features.length;
  if (!size || [model.means, model.scales, model.coefficients].some(a => a.length !== size)
      || !Number.isFinite(model.intercept)) throw new Error('Invalid demonstration model.');
  return model.features.reduce((total, feature, index) => {
    const value = inputs[feature], mean = model.means[index], scale = model.scales[index], coefficient = model.coefficients[index];
    if (![value, mean, scale, coefficient].every(Number.isFinite) || scale <= 0)
      throw new Error('Enter finite values for all example inputs.');
    return total + ((value - mean) / scale) * coefficient;
  }, model.intercept);
}
