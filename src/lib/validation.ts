import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const moneySchema = z.coerce.number().finite().min(0).max(999999999999.99);
export const percentageSchema = z.coerce.number().finite().min(0).max(100);

export const assessmentWeightSchema = z.object({
  name: z.string().trim().min(1).max(150),
  maxScore: z.coerce.number().finite().positive().max(100000),
  weightPercent: percentageSchema,
});

export const assessmentConfigurationSchema = z.object({
  components: z.array(assessmentWeightSchema).min(1),
}).superRefine((value, ctx) => {
  const total = value.components.reduce((sum, item) => sum + item.weightPercent, 0);
  if (Math.abs(total - 100) > 0.0001) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["components"],
      message: `Assessment weights must total exactly 100%. Current total: ${total.toFixed(2)}%.`,
    });
  }
});

export const scoreSchema = z.object({
  score: z.coerce.number().finite().min(0),
  maximumScore: z.coerce.number().finite().positive(),
}).superRefine((value, ctx) => {
  if (value.score > value.maximumScore) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["score"],
      message: `Score cannot exceed the maximum score of ${value.maximumScore}.`,
    });
  }
});

export const studentInputSchema = z.object({
  studentNumber: z.string().trim().min(1).max(50),
  admissionNumber: z.string().trim().max(50).optional().or(z.literal("")),
  firstName: z.string().trim().min(1).max(100),
  middleName: z.string().trim().max(100).optional().or(z.literal("")),
  lastName: z.string().trim().min(1).max(100),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string().date().optional().or(z.literal("")),
  admissionDate: z.string().date().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  nationality: z.string().trim().max(80).optional().or(z.literal("")),
});

export const paymentInputSchema = z.object({
  studentId: uuidSchema,
  amount: moneySchema.refine((value) => value > 0, "Payment amount must be greater than zero."),
  method: z.enum(["cash", "mobile_money", "bank_transfer", "card", "other"]),
  reference: z.string().trim().max(150).optional().or(z.literal("")),
  paymentDate: z.string().date(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type AssessmentConfigurationInput = z.infer<typeof assessmentConfigurationSchema>;
export type StudentInput = z.infer<typeof studentInputSchema>;
