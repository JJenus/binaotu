import { boolean, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { PARENT_KINDS, ROLES, SEXES, UNION_KINDS, VISIBILITIES } from '../../shared/types'

export const visibilityEnum = pgEnum('visibility', VISIBILITIES)
export const sexEnum = pgEnum('sex', SEXES)
export const parentKindEnum = pgEnum('parent_kind', PARENT_KINDS)
export const unionKindEnum = pgEnum('union_kind', UNION_KINDS)

export const roleEnum = pgEnum('family_role', ROLES)

export const users = pgTable('app_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

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

export const familyMembers = pgTable('family_member', {
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [primaryKey({ columns: [t.familyId, t.userId] }), index('family_member_user_idx').on(t.userId)])

export const invites = pgTable('family_invite', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  role: roleEnum('role').notNull().default('viewer'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, t => [index('family_invite_family_idx').on(t.familyId)])
