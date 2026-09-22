import dotenv from "dotenv";
import { Pool } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing from .env.local");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const stages = [
  ["KINDERGARTEN", "Kindergarten", 1, 2],
  ["LOWER_PRIMARY", "Lower Primary", 3, 5],
  ["UPPER_PRIMARY", "Upper Primary", 6, 8],
  ["JHS", "Junior High School", 9, 11],
];
const languages = [
  ["EWE", "Ewe"], ["TWI_ASANTE", "Twi (Asante)"], ["TWI_AKUAPEM", "Twi (Akuapem)"],
  ["FANTE", "Fante"], ["GA", "Ga"], ["DANGME", "Dangme"], ["DAGBANI", "Dagbani"],
  ["DAGAARE", "Dagaare"], ["KASEM", "Kasem"], ["NZEMA", "Nzema"], ["GONJA", "Gonja"],
];
const subjects = {
  KINDERGARTEN: [
    ["ENGLISH_LANGUAGE_LITERACY", "English Language & Literacy", "CORE", true, null, true, false],
    ["NUMERACY", "Numeracy", "CORE", true, null, true, false],
    ["OWOP", "Our World Our People (OWOP)", "CORE", true, null, true, false],
    ["CREATIVE_ARTS", "Creative Arts", "CORE", true, null, true, false],
    ["GHANAIAN_LANGUAGE_LITERACY", "Ghanaian Language & Literacy", "COMPULSORY_PARAMETERIZED", true, "GHANAIAN_LANGUAGE", true, false],
  ],
  LOWER_PRIMARY: [
    ["ENGLISH_LANGUAGE", "English Language", "CORE", true, null, true, false], ["MATHEMATICS", "Mathematics", "CORE", true, null, true, false],
    ["SCIENCE", "Science", "CORE", true, null, true, false], ["CREATIVE_ARTS", "Creative Arts", "CORE", true, null, true, false],
    ["OWOP", "Our World Our People (OWOP)", "CORE", true, null, true, false], ["HISTORY_OF_GHANA", "History of Ghana", "CORE", true, null, true, false],
    ["RME", "Religious and Moral Education (RME)", "CORE", true, null, true, false], ["PE", "Physical Education (PE)", "CORE", true, null, true, false],
    ["GHANAIAN_LANGUAGE", "Ghanaian Language", "COMPULSORY_PARAMETERIZED", true, "GHANAIAN_LANGUAGE", true, false],
    ["FRENCH", "French", "ELECTIVE", false, null, true, false],
  ],
  UPPER_PRIMARY: [
    ["ENGLISH_LANGUAGE", "English Language", "CORE", true, null, true, false], ["MATHEMATICS", "Mathematics", "CORE", true, null, true, false],
    ["SCIENCE", "Science", "CORE", true, null, true, false], ["COMPUTING", "Computing (ICT)", "CORE", true, null, true, false],
    ["CREATIVE_ARTS", "Creative Arts", "CORE", true, null, true, false], ["HISTORY_OF_GHANA", "History of Ghana", "CORE", true, null, true, false],
    ["RME", "Religious and Moral Education (RME)", "CORE", true, null, true, false], ["PE", "Physical Education (PE)", "CORE", true, null, true, false],
    ["FRENCH", "French", "CORE", true, null, true, false], ["GHANAIAN_LANGUAGE", "Ghanaian Language", "COMPULSORY_PARAMETERIZED", true, "GHANAIAN_LANGUAGE", true, false],
    ["ARABIC", "Arabic", "ELECTIVE", false, null, true, false],
  ],
  JHS: [
    ["ENGLISH_LANGUAGE", "English Language", "CORE", true, null, true, false], ["MATHEMATICS", "Mathematics", "CORE", true, null, true, false],
    ["GENERAL_SCIENCE", "General Science", "CORE", true, null, true, false], ["SOCIAL_STUDIES", "Social Studies", "CORE", true, null, true, false],
    ["COMPUTING", "Computing (ICT)", "CORE", true, null, true, false], ["CAREER_TECHNOLOGY", "Career Technology", "CORE", true, null, true, false],
    ["CREATIVE_ARTS_DESIGN", "Creative Arts and Design", "CORE", true, null, true, false], ["RME", "Religious and Moral Education (RME)", "CORE", true, null, true, false],
    ["GHANAIAN_LANGUAGE", "Ghanaian Language", "COMPULSORY_PARAMETERIZED", true, "GHANAIAN_LANGUAGE", true, false],
    ["FRENCH", "French", "ELECTIVE", false, null, true, false], ["ARABIC", "Arabic", "ELECTIVE", false, null, true, false],
    ["PHYSICAL_HEALTH_EDUCATION", "Physical and Health Education", "ACTIVITY", false, null, false, true],
  ],
};

try {
  for (const [code, name, min, max] of stages) {
    await pool.query(`INSERT INTO curriculum_stages (code,name,min_sort_order,max_sort_order) VALUES ($1,$2,$3,$4) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name,min_sort_order=EXCLUDED.min_sort_order,max_sort_order=EXCLUDED.max_sort_order`, [code, name, min, max]);
  }
  for (let i = 0; i < languages.length; i++) {
    await pool.query(`INSERT INTO ghanaian_languages (code,name,sort_order) VALUES ($1,$2,$3) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name,sort_order=EXCLUDED.sort_order,active=true`, [...languages[i], i + 1]);
  }
  for (const [stageCode, rows] of Object.entries(subjects)) {
    const { rows: stageRows } = await pool.query("SELECT id FROM curriculum_stages WHERE code=$1", [stageCode]);
    for (let i = 0; i < rows.length; i++) {
      await pool.query(`INSERT INTO curriculum_subjects (curriculum_stage_id,code,name,category,compulsory,parameterized,examinable,activity_based,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (curriculum_stage_id,code) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,compulsory=EXCLUDED.compulsory,parameterized=EXCLUDED.parameterized,examinable=EXCLUDED.examinable,activity_based=EXCLUDED.activity_based,sort_order=EXCLUDED.sort_order,active=true`, [stageRows[0].id, ...rows[i], i + 1]);
    }
  }
  console.log("Curriculum reference data seeded successfully.");
} finally {
  await pool.end();
}
