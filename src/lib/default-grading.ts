import type {
  GradeBand,
} from "@/lib/grading";

export const DEFAULT_GRADE_BANDS:
  GradeBand[] = [
    {
      grade: "A",
      label: "Excellent",
      minimumPercent: 80,
      maximumPercent: 100,
      remark: "Excellent performance",
    },
    {
      grade: "B",
      label: "Very Good",
      minimumPercent: 70,
      maximumPercent: 79.99,
      remark: "Very good performance",
    },
    {
      grade: "C",
      label: "Good",
      minimumPercent: 60,
      maximumPercent: 69.99,
      remark: "Good performance",
    },
    {
      grade: "D",
      label: "Credit",
      minimumPercent: 50,
      maximumPercent: 59.99,
      remark: "Satisfactory performance",
    },
    {
      grade: "E",
      label: "Pass",
      minimumPercent: 40,
      maximumPercent: 49.99,
      remark: "Pass",
    },
    {
      grade: "F",
      label: "Fail",
      minimumPercent: 0,
      maximumPercent: 39.99,
      remark: "Needs improvement",
    },
  ];