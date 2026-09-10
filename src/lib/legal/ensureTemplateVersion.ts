import { prisma } from "@/lib/prisma";
import { deserializeJsonFields } from "@/lib/jsonFields";
import { TEMPLATE_VERSION_JSON_FIELDS } from "@/lib/jsonFields";
import type { DocumentKey } from "@/lib/types/legal";
import { NEVER_TEMPLATED_KEYS, TEMPLATE_REGISTRY, buildPlaceholderBody } from "./templateRegistry";

/** Lazily creates the DocumentTemplate/TemplateVersion rows for a registry entry the first time
 * it's needed, rather than requiring a separate seed step -- the static TEMPLATE_REGISTRY stays
 * the single source of truth for template content. Returns null for a key that must never be
 * template-generated (see NEVER_TEMPLATED_KEYS) or isn't in the registry at all. */
export async function ensureTemplateVersion(key: DocumentKey) {
  if (NEVER_TEMPLATED_KEYS.includes(key)) return null;
  const entry = TEMPLATE_REGISTRY.find((e) => e.key === key);
  if (!entry) return null;

  const template = await prisma.documentTemplate.upsert({
    where: { key: entry.key },
    update: {},
    create: { key: entry.key, name: entry.name, description: entry.description, transactionType: entry.transactionType },
  });

  let version = await prisma.templateVersion.findFirst({ where: { templateId: template.id }, orderBy: { version: "desc" } });
  if (!version) {
    version = await prisma.templateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        bodyPlaceholder: buildPlaceholderBody(entry.name),
        attorneyReviewStatus: "DRAFT_NOT_REVIEWED",
      },
    });
  }

  return { template, version: deserializeJsonFields(version, TEMPLATE_VERSION_JSON_FIELDS) };
}
