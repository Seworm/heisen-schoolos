CREATE TYPE "public"."platform_role" AS ENUM('platform_admin', 'super_admin');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "platform_role" "platform_role";