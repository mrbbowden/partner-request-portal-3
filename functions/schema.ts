import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const partners = pgTable("partners", {
  id: varchar("id", { length: 9 }).primaryKey(),
  partnerName: text("partner_name").notNull(),
  partnerEmail: text("partner_email"),
  partnerPhone: text("partner_phone"),
  partnerStreetAddress: text("partner_street_address"),
  partnerCity: text("partner_city"),
  partnerState: text("partner_state"),
  partnerZip: text("partner_zip"),
});

export const requests = pgTable("requests", {
  id: varchar("id").primaryKey(),
  partnerId: varchar("partner_id", { length: 9 }).notNull().references(() => partners.id),
  partnerName: text("partner_name").notNull(),
  caseManagerName: text("case_manager_name").notNull(),
  caseManagerEmail: text("case_manager_email").notNull(),
  caseManagerPhone: text("case_manager_phone").notNull(),
  // Recipient fields
  recipientsName: text("recipients_name").notNull(),
  recipientsStreetAddress: text("recipients_street_address").notNull(),
  recipientsCity: text("recipients_city").notNull(),
  recipientsState: text("recipients_state").notNull(),
  recipientsZip: text("recipients_zip").notNull(),
  recipientsEmail: text("recipients_email").notNull(),
  recipientsPhone: text("recipients_phone").notNull(),
  race: text("race").notNull(),
  ethnicity: text("ethnicity").notNull(),
  // Household Information
  numberOfMenInHousehold: text("number_of_men_in_household").notNull(),
  numberOfWomenInHousehold: text("number_of_women_in_household").notNull(),
  numberOfChildrenInHousehold: text("number_of_children_in_household").notNull(),
  employedHousehold: text("employed_household").notNull(),
  englishSpeaking: text("english_speaking").notNull(),
  descriptionOfNeed: text("description_of_need").notNull(),
  webhookStatus: text("webhook_status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPartnerSchema = createInsertSchema(partners);
export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
