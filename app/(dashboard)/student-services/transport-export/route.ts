import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  students,
  transportAssignments,
  transportRoutes,
} from "@/db/schema";
import { requirePermission } from "@/lib/authorization";
import { requireCurrentSchool } from "@/lib/current-school";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const school = await requireCurrentSchool();
  await requirePermission("operations.read", school.id);

  const rows = await db
    .select({
      routeName: transportRoutes.name,
      vehicleNumber: transportRoutes.vehicleNumber,
      driverName: transportRoutes.driverName,
      driverPhone: transportRoutes.driverPhone,
      stops: transportRoutes.stops,
      studentNumber: students.studentNumber,
      firstName: students.firstName,
      middleName: students.middleName,
      lastName: students.lastName,
      pickupStop: transportAssignments.pickupStop,
      dropoffStop: transportAssignments.dropoffStop,
      status: transportAssignments.status,
      assignedAt: transportAssignments.assignedAt,
    })
    .from(transportAssignments)
    .innerJoin(
      transportRoutes,
      eq(transportRoutes.id, transportAssignments.routeId),
    )
    .innerJoin(
      students,
      eq(students.id, transportAssignments.studentId),
    )
    .where(eq(transportAssignments.schoolId, school.id))
    .orderBy(asc(transportRoutes.name), asc(students.lastName));

  const header = [
    "Route",
    "Vehicle number",
    "Driver",
    "Driver phone",
    "Route stops",
    "Student number",
    "Student name",
    "Pickup stop",
    "Drop-off stop",
    "Assignment status",
    "Assigned at",
  ];
  const csvRows = rows.map((row) => [
    row.routeName,
    row.vehicleNumber,
    row.driverName,
    row.driverPhone,
    row.stops.join("; "),
    row.studentNumber,
    [row.firstName, row.middleName, row.lastName]
      .filter(Boolean)
      .join(" "),
    row.pickupStop,
    row.dropoffStop,
    row.status,
    row.assignedAt.toISOString(),
  ]);
  const csv = [header, ...csvRows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="transport-assignments.csv"',
      "Cache-Control": "no-store",
    },
  });
}
