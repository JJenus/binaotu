import { boolean, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const visibilityEnum = pgEnum('visibility', ['public', 'private'])
export const sexEnum = pgEnum('sex', ['male', 'female', 'unknown'])
export const parentKindEnum = pgEnum('parent_kind', ['biological', 'adoptive', 'step'])
export const unionKindEnum = pgEnum('union_kind', ['marriage', 'partnership', 'other'])

export const families = pgTable('family', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  visibility: visibilityEnum('visibility').notNull().default('public'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const persons = pgTable('person', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  givenName: text('given_name').notNull(),
  familyName: text('family_name'),
  sex: sexEnum('sex').notNull().default('unknown'),
  birthYear: integer('birth_year'),
  deathYear: integer('death_year'),
  birthPlace: text('birth_place'),
  notes: text('notes'),
  isPlaceholder: boolean('is_placeholder').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('person_family_idx').on(t.familyId)])

export const parentLinks = pgTable('parent_link', {
  childId: uuid('child_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  kind: parentKindEnum('kind').notNull().default('biological')
}, t => [primaryKey({ columns: [t.childId, t.parentId] }), index('parent_link_parent_idx').on(t.parentId)])

export const unions = pgTable('union', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  partnerAId: uuid('partner_a_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  partnerBId: uuid('partner_b_id').notNull().references(() => persons.id, { onDelete: 'cascade' }),
  kind: unionKindEnum('kind').notNull().default('partnership'),
  startYear: integer('start_year'),
  endYear: integer('end_year')
}, t => [index('union_family_idx').on(t.familyId)])
