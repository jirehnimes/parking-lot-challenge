/** biome-ignore-all lint/suspicious/noExplicitAny: Arguments can be in any format */
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export const ValidateRequest = (dto: any) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      // In Express routes: args[0] = req, args[1] = res, args[2] = next
      const request = args[0];
      const response = args[1];

      if (!request?.body) {
        return response.status(400).json({ error: 'Missing request body' });
      }

      // Convert literal payload to DTO instance
      const outputObj = plainToInstance(dto, request.body);

      // Run validation rules
      const errors = await validate(outputObj);

      if (errors.length > 0) {
        // Map constraints out to send back simple error strings
        const formattedErrors = errors.map((err) => ({
          field: err.property,
          errors: Object.values(err.constraints || {}),
        }));

        return response.status(400).json({ errors: formattedErrors });
      }

      // Overwrite the raw req.body with the sanitized/transformed instance
      request.body = outputObj;

      // Proceed with normal method operation
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};
