import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from '../backend/node_modules/dotenv/lib/main.js'
import mongoose from '../backend/node_modules/mongoose/index.js'
import { loadPropositionTranslationRules } from '../backend/src/proposition/proposition-translation-rules-loader.js'

const REPO_ROOT = path.resolve(new URL('..', import.meta.url).pathname)
const OUTPUT_DIR = path.join(REPO_ROOT, 'docs', 'proposition-translation')
const JSON_REPORT_PATH = path.join(OUTPUT_DIR, 'audit-report.json')
const MD_REPORT_PATH = path.join(OUTPUT_DIR, 'audit-report.md')
const TARGET_TYPES = null

const KNOWN_RACE_TITLE_FRAGMENTS = [
  'Amatörlopp',
  'Bonuslopp',
  'Svensk Travsports Unghästserie',
  'Svensk Travsports Kallblodsserie',
  'Svensk Travsports Montéserie',
  'Svensk Trav-Kriterium',
  'Svenskt Trav-Kriterium',
  'Svenskt Trav-Oaks',
  'Svenskt Travderby',
  'Svensk Uppfödningslöpning',
  'Svensk Travsport',
  'Sedvanlig spårlottning',
  'Solvallaserien',
  'Spår efter startpoäng',
  'Stayerlopp',
  'Fördel under 18 år',
  'Fördel Tre-/Fyraåriga',
  'Treåringslopp',
  'Treåringar',
  'Tre-/Fyraåringslopp',
  'Tvååringslopp',
  'Fyraåringslopp',
  'Presenteras av',
  'Lärlingsserien',
  'Lärlingsserie',
  'Delningslopp',
  'Dam-SM',
  'B-tränarserie',
  'B-tränarserien',
  'B-tränarlopp',
  'Breeders\' Crown',
  'Bronsdivisionen',
  'Customserien',
  'Diamantstoet',
  'Gulddivisionen',
  'K30-lopp',
  'Klass I',
  'Klass II',
  'Klass III',
  'Montéfinal',
  'Montéryttar-SM',
  'Montéryttarserie',
  'P22-lopp',
  'Silverdivisionen',
  'StoChampionatet',
  'Stodivisionen',
  'Uttagningslopp',
  'Ungdomslopp',
  'Juniorchans',
  'Specialare',
  'Breddlopp',
  'Breddlopp',
  'Breddplus',
  'Spårtrappa',
  'Montélopp',
  'Montéserie',
  'Premielopp',
  'Treåriga',
  'Fyraåriga',
  'Stolopp',
  'Fördel Ston',
  'Fördel Treåriga',
  'Hingstar/Valacker',
  'Amatör-SM',
  'Delningsproposition',
  'Lärlingslopp',
  'Kvallopp',
  'P21-lopp',
  'P21',
  'U30/K150',
  'U30/K400',
  'U25/K100',
  'Monté',
  'Omgång',
  'Ston'
].sort((left, right) => right.length - left.length)

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function isGenericLTitle(text, propositionType) {
  if (propositionType !== 'L') return false

  const normalized = normalizeWhitespace(text)
  if (!normalized) return false
  if (/^Prop\./.test(normalized)) return false
  if (/^Presenteras av\b/.test(normalized)) return false

  return true
}

function isKnownRaceTitleChain(value) {
  const normalized = normalizeWhitespace(value)
  if (!normalized || /[.:]/.test(normalized)) return false

  let remaining = normalized
  for (const fragment of KNOWN_RACE_TITLE_FRAGMENTS) {
    remaining = remaining.replaceAll(fragment, '')
  }

  return remaining.replace(/\s*-\s*/g, '').replace(/\s+/g, '') === ''
}

function splitPrefixedRaceTitle(value) {
  const normalized = normalizeWhitespace(value)
  const segments = normalized.split(/\s+-\s+/)

  if (segments.length < 2) return null

  for (let index = 1; index < segments.length; index += 1) {
    const titlePrefix = segments.slice(0, index).join(' - ')
    const raceTitle = segments.slice(index).join(' - ')

    if (titlePrefix && isKnownRaceTitleChain(raceTitle)) {
      return { titlePrefix, raceTitle }
    }
  }

  return null
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function splitYearSuffixedRaceTitle(value) {
  const normalized = normalizeWhitespace(value)
  const yearMatch = normalized.match(/^(.+)\s+(\d{4})$/)
  if (!yearMatch) return null

  const titleWithPrefix = yearMatch[1]
  const titleYear = yearMatch[2]

  for (const fragment of KNOWN_RACE_TITLE_FRAGMENTS) {
    const suffixMatch = titleWithPrefix.match(new RegExp(`^(.+)\\s+(${escapeRegExp(fragment)})$`))
    if (suffixMatch) {
      return {
        titlePrefix: suffixMatch[1],
        raceTitle: suffixMatch[2],
        titleYear
      }
    }
  }

  return null
}

function splitSentences(text) {
  return normalizeWhitespace(text)
    .replace(/\bProp\.\s+/g, 'Prop.__SPACE__')
    .replace(/\bkat\.\s+/g, 'kat.__SPACE__')
    .replace(/\bt\.o\.m\s+/g, 't.o.m__SPACE__')
    .replace(/\bfr\.o\.m\.\s+/g, 'fr.o.m.__SPACE__')
    .replace(/\binkl\.\s+/g, 'inkl.__SPACE__')
    .replace(/\bexkl\.\s+/g, 'exkl.__SPACE__')
    .split(/(?<=\.)\s+/)
    .map(sentence => sentence
      .replace(/Prop\.__SPACE__/g, 'Prop. ')
      .replace(/kat\.__SPACE__/g, 'kat. ')
      .replace(/t\.o\.m__SPACE__/g, 't.o.m ')
      .replace(/fr\.o\.m\.__SPACE__/g, 'fr.o.m. ')
      .replace(/inkl\.__SPACE__/g, 'inkl. ')
      .replace(/exkl\.__SPACE__/g, 'exkl. '))
    .map(sentence => sentence.trim())
    .filter(Boolean)
}

function normalizeTemplate(sentence, propositionType = null) {
  const text = normalizeWhitespace(sentence)
  if (text === 'Final på Rättvik 2/8.' || text === 'Final på Östersund 13/12.') {
    return text
  }
  if (/^Tillägg\b/.test(text) && (/\bvid\b/.test(text) || /\bför\b/.test(text))) {
    return text.endsWith('.') ? 'Tillägg {allowance_text}.' : 'Tillägg {allowance_text}'
  }
  if (/^\d+\s+m\s+vid\b/.test(text)) {
    return text.endsWith('.') ? '{allowance_text}.' : '{allowance_text}'
  }

  const template = text
    .replace(/^Varmblodiga$/g, '{breed_type}')
    .replace(/^Kallblodiga$/g, '{breed_type}')
    .replace(/^För alla försök gäller att tvångsprissumman beräknas utifrån gällande regler för landet där försöket körs\.$/g, 'För alla försök gäller att tvångsprissumman beräknas ut ifrån gällande regler för landet där försöket körs.')
    .replace(/^Försök 1,3,5 körs med proposition 50\.001-([\d. ]+) kr\.$/g, 'Försök 1, 3 och 5 körs med proposition 50.001-{amount_kr} kr.')
    .replace(/^Försök 2,4,6 körs med proposition 170\.001-([\d. ]+) kr\.$/g, 'Försök 2, 4 och 6 körs med proposition 170.001-{amount_kr} kr.')
    .replace(/^Final på (.+?) (\d+\/\d+)\.$/g, 'Final på {track_name} {date_text}.')
    .replace(/^Hästarna från försök 1 startar i finalen från distansen (\d{3,4})\s*m, hästar från försök 2 startar från distansen (\d{3,4})\s*m och hästar från försök 3 från distansen (\d{3,4})\s*m\.$/g, 'Hästarna från försök 1 startar i finalen från distansen {distance_m_1} m, hästar från försök 2 startar från distansen {distance_m_2} m och hästar från försök 3 från distansen {distance_m_3} m.')
    .replace(/^DubbelCupen Meeting (\d+): Försök körs på (.+)\.$/g, 'DubbelCupen Meeting {meeting_number}: Försök körs på {meeting_schedule}.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr, 40 m {amount_kr_2} kr.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m vid vunna ([\d. ]+) kr,\s+tv h\/v\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr, 40 m vid vunna {amount_kr_2} kr, tv h/v.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m vid vunna ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr, 40 m vid vunna {amount_kr_2} kr.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr,\s+20 m h\/v\.$/g, 'Finalproposition: {distance_m} m voltstart, 20 m vid vunna {amount_kr_1} kr, 40 m {amount_kr_2} kr, 20 m h/v.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+alla inkvalade ston,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr,\s+60 m ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, alla inkvalade ston, 20 m vid vunna {amount_kr_1} kr, 40 m {amount_kr_2} kr, 60 m {amount_kr_3} kr.')
    .replace(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+alla inkvalade ston,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m ([\d. ]+) kr\.$/g, 'Finalproposition: {distance_m} m voltstart, alla inkvalade ston, 20 m vid vunna {amount_kr_1} kr, 40 m {amount_kr_2} kr.')
    .replace(/^Anmälningsavgiften till detta lopp är ([\d. ]+) kr \(inkl\.? moms\)\.$/g, 'Anmälningsavgiften till detta lopp är {amount_kr} kr (inkl moms).')
    .replace(/^Övrigt: Se separat utgiven proposition eller www\.stochampionatet\.se Anmälningsavgift: ([\d. ]+) kronor exkl\.? moms\.$/g, 'Övrigt: Se separat utgiven proposition eller www.stochampionatet.se Anmälningsavgift: {amount_kr} kronor exkl moms.')
    .replace(/^Anmälningsavgift:\s*([\d. ]+)\s+(SEK|Euro)\.$/g, 'Anmälningsavgift: {amount_fee} {currency}.')
    .replace(/^Anmälningsavgift:\s*([\d. ]+) SEK \(ex moms\)\.$/g, 'Anmälningsavgift: {amount_kr} SEK (ex moms).')
    .replace(/^Anmälningsavgift:\s*([\d. ]+) kr exkl moms\.$/g, 'Anmälningsavgift: {amount_kr} kr exkl moms.')
    .replace(/^Anmälningsavgift\s+([\d. ]+) kr \(exkl moms\)\.$/g, 'Anmälningsavgift {amount_kr} kr (exkl moms).')
    .replace(/^Startanmälningsavgiften till detta lopp är ([\d. ]+) kr inkl\.? moms\.$/g, 'Startanmälningsavgiften till detta lopp är {amount_kr} kr inkl moms.')
    .replace(/^Prop\.\s+([0-9A-Z]+)\.$/g, 'Prop. {prop_number}.')
    .replace(/^Prop\.\s+([0-9A-Z]+)\.\s+(.+)$/g, 'Prop. {prop_number}. {prop_title}')
    .replace(/^Halvrad tillåts t\.o\.m\s+(.+)$/g, 'Halvrad tillåts t.o.m {date_text}')
    .replace(/^Företrädesregeln gäller\.$/g, 'Företrädesregeln gäller.')
    .replace(/^Punkt\s+(\d+)\s+tillämpas i detta lopp\.$/g, 'Punkt {rule_point} tillämpas i detta lopp.')
    .replace(/^Närmast upp t\.o\.m\s+([\d.]+)\s+kr\.$/g, 'Närmast upp t.o.m {amount_kr} kr.')
    .replace(/^(\d+)\s+enligt punkt\s+(\d+)\.$/g, '{selection_count} enligt punkt {rule_point}.')
    .replace(/^Företräde för (.+)\.$/g, 'Företräde för {priority_group}.')
    .replace(/^Hemmahästar har företräde,\s+som hemmabana räknas även (.+)\.$/g, 'Hemmahästar har företräde, som hemmabana räknas även {home_track_aliases}.')
    .replace(/^(\d+)\s+hemmahästar har företräde\.$/g, '{home_horse_count} hemmahästar har företräde.')
    .replace(/^(\d+)\s+hemmahästar har företräde,\s+som hemmabana räknas även (.+)\.$/g, '{home_horse_count} hemmahästar har företräde, som hemmabana räknas även {home_track_aliases}.')
    .replace(/^(.+?)\s+(kan utdela|kan i samråd utdela|har möjlighet att dela ut|har även möjlighet att dela ut|har möjligheten att dela ut|förbehåller sig rätten att dela ut)\s+(ett wildcard|två wildcard|två wildcards|högst två wildcards|tre wildcards|wildcards)( i detta lopp(?:, företrädesvis till häst i träning i utlandet|, företrädesvis till häst i utländsk träning|, i första hand till utländska ekipage| oavsett startpoäng)?\.| i loppet\.|\.)$/g, '{wildcard_authority} {wildcard_action} {wildcard_award_phrase}{wildcard_context}')
    .replace(/^Wildcard har utdelats till (.+)\.$/g, 'Wildcard har utdelats till {wildcard_recipients}.')
    .replace(/^Wildcards har utdelats till (.+)\.$/g, 'Wildcards har utdelats till {wildcard_recipients}.')
    .replace(/^Wildcards har utdelads till (.+)\.$/g, 'Wildcards har utdelads till {wildcard_recipients}.')
    .replace(/^Ett wildcard har tilldelats (.+)\.$/g, 'Ett wildcard har tilldelats {wildcard_recipients}.')
    .replace(/^Presenteras av (.+)\.$/g, 'Presenteras av {presented_by_name}.')
    .replace(/^Presenteras av ([^.]+)$/g, 'Presenteras av {presented_by_name}')
    .replace(/^Hederspris till segrande hästs (.+)\.$/g, 'Hederspris till segrande hästs {honorary_prize_recipients}.')
    .replace(/^(.+) hederspris till segrande hästs (.+)\.$/g, '{sponsor_name} hederspris till segrande hästs {honorary_prize_recipients}.')
    .replace(/^Hederstäcke och lagerkrans till segrande häst\.?$/g, 'Hederstäcke och lagerkrans till segrande häst.')
    .replace(/^Hederspris till teamet kring segrande häst\.?$/g, 'Hederspris till teamet kring segrande häst.')
    .replace(/^Hederspris till kretsen runt segrande häst\.?$/g, 'Hederspris till kretsen runt segrande häst.')
    .replace(/^Hederspris och segertavla till segrande hästs ägare\.?$/g, 'Hederspris och segertavla till segrande hästs ägare.')
    .replace(/^Presentkort och segertavla till segrande hästs ägare\.?$/g, 'Presentkort och segertavla till segrande hästs ägare.')
    .replace(/^(.+?) hederstäcke och lagerkrans till segrande häst\.?$/gi, '{sponsor_name} hederstäcke och lagerkrans till segrande häst.')
    .replace(/^(.+?) hederstäcke till segrande häst\.?$/gi, '{sponsor_name} hederstäcke till segrande häst.')
    .replace(/^(Kvallopp|Spårtrappa|Premielopp|Stolopp|P21-lopp)$/g, '{race_title}')
    .replace(/^Körsvenskrav kat\.\s+(\d+)\.$/g, 'Körsvenskrav kat. {driver_category}.')
    .replace(/^(Körsvenner|Ryttare) födda (\d{6}) eller tidigare(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/g, '{participant_role} födda {driver_birth_date} eller tidigare{driver_race_limit}.')
    .replace(/^(Körsvenner|Ryttare) födda (\d{6}) till (\d{6})(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/g, '{participant_role} födda {driver_birth_date_start} till {driver_birth_date_end}{driver_race_limit}.')
    .replace(/^(Körsvenner|Ryttare) födda (\d{6}) eller tidigare(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.([\d.]+)-([\d.]+) kr ((?:körsvenner|ryttare) med högst \d+ (?:sulkylopp|montélopp) under \d{4})\.$/g, '{participant_role} födda {driver_birth_date} eller tidigare{driver_race_limit}.{amount_min_kr}-{amount_max_kr} kr {secondary_driver_race_limit}.')
    .replace(/^Hos tränare som gjort högst (\d+) starter under (\d{4})\.$/g, 'Hos tränare som gjort högst {trainer_start_limit} starter under {trainer_start_year}.')
    .replace(/^I oavbruten ([AB])-träning fr\.o\.m\. (\d{6})(,\s*körda av B- eller K- licensinnehavare(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?\.$/g, 'I oavbruten {training_code}-träning fr.o.m. {training_since_date}{eligibility_suffix}.')
    .replace(/^Alla\.$/g, 'Alla.')
    .replace(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr((?: med högst \d+ poäng(?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen)?(?: i [AB]-träning)?|(?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen)(?: i [AB]-träning)?|,\s*körda av B- eller K- licensinnehavare(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?))\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr samt {eligibility_subject_secondary} {amount_secondary_min_kr} - {amount_secondary_max_kr} kr{secondary_clause_suffix}.')
    .replace(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr samt {eligibility_subject_secondary} lägst {amount_secondary_kr} kr{points_limit}.')
    .replace(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr samt {eligibility_subject_secondary} {amount_secondary_min_kr} - {amount_secondary_max_kr} kr.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+högst\s+([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/g, '{eligibility_subject} högst {amount_kr} kr{points_limit}{eligibility_suffix}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/g, '{eligibility_subject} lägst {amount_kr} kr{points_limit}{eligibility_suffix}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr{points_limit}{eligibility_suffix}.')
    .replace(/^(\d)-åriga ([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{age_exact}-åriga {amount_min_kr} - {amount_max_kr} kr{points_limit}.')
    .replace(/^(\d)-åriga och äldre högst ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{age_min}-åriga och äldre högst {amount_kr} kr{points_limit}.')
    .replace(/^(\d)-åriga och äldre lägst ([\d.]+) kr\.$/g, '{age_min}-åriga och äldre lägst {amount_kr} kr.')
    .replace(/^(\d)-åriga och äldre ([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{age_min}-åriga och äldre {amount_min_kr} - {amount_max_kr} kr{points_limit}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+högst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{eligibility_subject} högst {amount_kr} kr{points_limit}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{eligibility_subject} lägst {amount_kr} kr{points_limit}.')
    .replace(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/g, '{eligibility_subject} {amount_min_kr} - {amount_max_kr} kr{points_limit}.')
    .replace(/^Häst som får godkänt resultat i premielopp stryks därmed från premiechansen\.$/g, 'Häst som får godkänt resultat i premielopp stryks därmed från premiechansen.')
    .replace(/^Ej häst med begränsade rättigheter\.$/g, 'Ej häst med begränsade rättigheter.')
    .replace(/^Hederstäcke till segrande häst\.$/g, 'Hederstäcke till segrande häst.')
    .replace(/^Spårtilldelning enligt spårtrappa\.$/g, 'Spårtilldelning enligt spårtrappa.')
    .replace(/^Spår efter spårtrappa\.$/g, 'Spår efter spårtrappa.')
    .replace(/^Anmälda hästar delas upp efter startprissumma med högst tolv startande per lopp\.$/g, 'Anmälda hästar delas upp efter startprissumma med högst tolv startande per lopp.')
    .replace(/^Anmälda hästar delas upp efter startprissumma i lämpligt antal lopp, med högst (\d+) startande i vardera lopp\.$/g, 'Anmälda hästar delas upp efter startprissumma i lämpligt antal lopp, med högst {runner_count} startande i vardera lopp.')
    .replace(/^Om fler än (\d+) hästar anmäls,? tas startande hästar ut i (P21-ordning|startpoängordning|poängordning)\.$/g, 'Om fler än {selection_limit} hästar anmäls tas startande hästar ut i {selection_order_basis}.')
    .replace(/^Vid fler än (\d+) anmälda hästar tillämpas tvångsstrykning, gjorda insatser återbetalas ej\.$/g, 'Vid fler än {selection_limit} anmälda hästar tillämpas tvångsstrykning, gjorda insatser återbetalas ej.')
    .replace(/^Har två hästar samma startpoäng tillämpas lottning\.$/g, 'Har två hästar samma startpoäng tillämpas lottning.')
    .replace(/^Spårtilldelning i respektive lopp enligt slumptal, dvs sedvanlig spå(?:r|t)lottning\.$/g, 'Spårtilldelning i respektive lopp enligt slumptal, dvs sedvanlig spårlottning.')
    .replace(/^Övriga hästar startar från distansen (\d{3,4}) meter\.$/g, 'Övriga hästar startar från distansen {distance_m} meter.')
    .replace(/^Hästar som körs av kuskar som ännu inte fyllt (\d+) år startar på distansen (\d{3,4}) meter\.$/g, 'Hästar som körs av kuskar som ännu inte fyllt {driver_age_limit} år startar på distansen {distance_m} meter.')
    .replace(/^Presentkort till segrande hästs ägare\.$/g, 'Presentkort till segrande hästs ägare.')
    .replace(/^Vinnarbild till segrande hästs ägare\.$/g, 'Vinnarbild till segrande hästs ägare.')
    .replace(/^Spår efter startpoäng där häst med lägst startpoäng får spår 1 osv, enligt följande ordning spår [0-9,]+\.$/g, 'Spår efter startpoäng där häst med lägst startpoäng får spår 1 osv, enligt följande ordning spår {track_order}.')
    .replace(/^De sju hästar med högst startpoäng med ([\d. ]+) - ([\d. ]+) kr intjänat \(([^)]+)\) startar från distansen (\d{3,4}) meter (?:med|från) spår ([0-9-]+)\.$/g, 'De sju hästar med högst startpoäng med {amount_min_kr} - {amount_max_kr} kr intjänat ({stl_division}) startar från distansen {distance_m} meter med spår {track_order}.')
    .replace(/^Poängberäkning enligt särskilda bestämmelser för STL-lopp\.$/g, 'Poängberäkning enligt särskilda bestämmelser för STL-lopp.')
    .replace(/^Poängställning kan ses på (.+)\.?$/g, 'Poängställning kan ses på {standings_url}')
    .replace(/^Se finalklara hästar här: (.+?)\.?$/g, 'Se finalklara hästar här: {standings_url}')
    .replace(/^En av propositionerna 1,2,3 eller 4 kommer om möjligt att delas i ytterligare ett lopp denna dag\.$/g, 'En av propositionerna 1,2,3 eller 4 kommer om möjligt att delas i ytterligare ett lopp denna dag.')
    .replace(/^Om en häst har kvalificerat sig som ordinarie till final i flera klasser ska den alltid starta i den högsta klassen\.$/g, 'Om en häst har kvalificerat sig som ordinarie till final i flera klasser ska den alltid starta i den högsta klassen.')
    .replace(/^Häst som kvalificerar sig för final är skyldig att starta i finalen på Eskilstuna 28 juni 2025 \(med skyldig menas att hästen måste starta i finalen och beläggs annars med startförbud under perioden 22 juni- 4 juli 2025\)\.$/g, 'Häst som kvalificerar sig för final är skyldig att starta i finalen på Eskilstuna 28 juni 2025 (med skyldig menas att hästen måste starta i finalen och beläggs annars med startförbud under perioden 22 juni- 4 juli 2025).')
    .replace(/^MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1995 eller senare som körs i tio försök under året där de tolv främsta kuskarna kvalificerar sig till final den 15 december\.$/g, 'MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1995 eller senare som körs i tio försök under året där de tolv främsta kuskarna kvalificerar sig till final den 15 december.')
    .replace(/^MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1996 eller senare som körs i åtta försök under året där de tolv främsta kuskarna kvalificerar sig till final på Mantorp 19\/10\.$/g, 'MantorpAkademins Ungdomsserie: En kuskserie för ungdomar födda 1996 eller senare som körs i åtta försök under året där de tolv främsta kuskarna kvalificerar sig till final på Mantorp 19/10.')
    .replace(/^Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden (.+)\.$/g, 'Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden {date_range_text}.')
    .replace(/\b\d{3,4}\s*m\b/g, '{distance_m} m')
    .replace(/\b(Autostart|Voltstart|Linjestart)\b/g, '{start_method}')
    .replace(/\b\d+\s+startande\b/g, '{runner_count} startande')
    .replace(/Pris:\s+[0-9.()]+(?:-[0-9.()]+)*\s+samt/g, 'Pris: {prize_ladder} samt')
    .replace(/Pris:\s+[0-9.()]+(?:-[0-9.()]+)*\s+kr/g, 'Pris: {prize_ladder} kr')
    .replace(/\b\d{1,3}(?:\.\d{3})+\s+kr\b/g, '{amount_kr} kr')
    .replace(/\((\d+)\s+prisplacerade\)/g, '({placed_count} prisplacerade)')
    .replace(/För premiechansad häst adderas \d+ % extra prispengar\./g, 'För premiechansad häst adderas {premium_chance_percent} % extra prispengar.')
    .replace(/Spår efter startsumma där häst med lägst startprissumma får spår 1 osv, enligt följande ordning spår [0-9,]+\./g, 'Spår efter startsumma där häst med lägst startprissumma får spår 1 osv, enligt följande ordning spår {track_order}.')

  if (template !== text) {
    return template
  }

  if (isKnownRaceTitleChain(text)) {
    return '{race_title}'
  }

  const prefixedRaceTitle = splitPrefixedRaceTitle(text)
  if (prefixedRaceTitle) {
    return '{title_prefix} - {race_title}'
  }

  const yearSuffixedRaceTitle = splitYearSuffixedRaceTitle(text)
  if (yearSuffixedRaceTitle) {
    return '{title_prefix} {race_title} {title_year}'
  }

  if (isGenericLTitle(text, propositionType)) {
    return '{race_title}'
  }

  if ((/^\d(?:-\d+)?-?åriga\b/i.test(text) || /^(?:svenska|norska)(?:\s+och\s+(?:svenska|norska))?\s+kallblodiga\.$/i.test(text)) && /^(.+)\.$/.test(text) && /(åriga|ston|kallblodiga|hingstar och valacker|svenska|norska|mockinländare)/i.test(text)) {
    return text.replace(/^(.+)\.$/g, '{eligibility_subject}.')
  }

  return template
}

function extractVariables(sentence, propositionType = null) {
  const text = normalizeWhitespace(sentence)
  const vars = {}
  const shortFinalNotice = text.match(/^Final på (.+?) (\d+\/\d+)\.$/i)
  const threeQualifierFinalDistances = text.match(/^Hästarna från försök 1 startar i finalen från distansen (\d{3,4})\s*m, hästar från försök 2 startar från distansen (\d{3,4})\s*m och hästar från försök 3 från distansen (\d{3,4})\s*m\.$/i)
  const dubbelCupMeetingIntro = text.match(/^DubbelCupen Meeting (\d+): Försök körs på (.+)\.$/i)
  const distance = text.match(/\b(\d{3,4})\s*m\b/)
  const finalPropositionTwoThresholdsRepeatedHv = text.match(/^Finalproposition:\s*(\d{3,4})\s+m\s+voltstart,\s+20 m vid vunna ([\d. ]+) kr,\s+40 m vid vunna ([\d. ]+) kr,\s+tv h\/v\.$/i)
  const otherHorsesDistance = text.match(/^Övriga hästar startar från distansen (\d{3,4}) meter\.$/i)
  const underAgeDriversDistance = text.match(/^Hästar som körs av kuskar som ännu inte fyllt (\d+) år startar på distansen (\d{3,4}) meter\.$/i)
  const breedType = text.match(/^(Varmblodiga|Kallblodiga)$/)
  const propLabel = text.match(/^Prop\.\s+([0-9A-Z]+)\.(?:\s+(.+))?$/)
  const halfRowDate = text.match(/^Halvrad tillåts t\.o\.m\s+(.+)$/)
  const rulePoint = text.match(/^Punkt\s+(\d+)\s+tillämpas i detta lopp\.$/)
  const shortRulePoint = text.match(/^(\d+)\s+enligt punkt\s+(\d+)\.$/)
  const priorityGroup = text.match(/^Företräde för (.+)\.$/)
  const homeTrackAliasesOnly = text.match(/^Hemmahästar har företräde,\s+som hemmabana räknas även (.+)\.$/i)
  const homeHorseCount = text.match(/^(\d+)\s+hemmahästar har företräde\.$/)
  const homeHorseCountWithAliases = text.match(/^(\d+)\s+hemmahästar har företräde,\s+som hemmabana räknas även (.+)\.$/i)
  const wildcardAuthorityClause = text.match(/^(.+?)\s+(kan utdela|kan i samråd utdela|har möjlighet att dela ut|har även möjlighet att dela ut|har möjligheten att dela ut|förbehåller sig rätten att dela ut)\s+(ett wildcard|två wildcard|två wildcards|högst två wildcards|tre wildcards|wildcards)( i detta lopp(?:, företrädesvis till häst i träning i utlandet|, företrädesvis till häst i utländsk träning|, i första hand till utländska ekipage| oavsett startpoäng)?\.| i loppet\.|\.)$/)
  const wildcardAwarded = text.match(/^(Wildcard har utdelats till|Wildcards har utdelats till|Wildcards har utdelads till|Ett wildcard har tilldelats)\s+(.+)\.$/)
  const presentedBy = text.match(/^Presenteras av (.+?)(?:\.)?$/)
  const honoraryPrize = text.match(/^Hederspris till segrande hästs (.+)\.$/)
  const sponsoredHonoraryPrize = text.match(/^(.+) hederspris till segrande hästs (.+)\.$/)
  const sponsoredHonorBlanketAndWreath = text.match(/^(.+?) hederstäcke och lagerkrans till segrande häst\.?$/i)
  const sponsoredHonorBlanket = text.match(/^(.+?) hederstäcke till segrande häst\.?$/i)
  const raceTitle = isKnownRaceTitleChain(text) ? text : null
  const prefixedRaceTitle = raceTitle ? null : splitPrefixedRaceTitle(text)
  const yearSuffixedRaceTitle = raceTitle || prefixedRaceTitle ? null : splitYearSuffixedRaceTitle(text)
  const driverCategory = text.match(/^Körsvenskrav kat\.\s+(\d+)\.$/)
  const participantBirthBefore = text.match(/^(Körsvenner|Ryttare) födda (\d{6}) eller tidigare(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/)
  const participantBirthRange = text.match(/^(Körsvenner|Ryttare) födda (\d{6}) till (\d{6})(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.$/)
  const mergedDriverRestriction = text.match(/^(Körsvenner|Ryttare) födda (\d{6}) eller tidigare(?: med högst (\d+) (sulkylopp|montélopp) under (\d{4}))?\.([\d.]+)-([\d.]+) kr ((?:körsvenner|ryttare) med högst (\d+) (?:sulkylopp|montélopp) under (\d{4}))\.$/i)
  const trainerStartLimit = text.match(/^Hos tränare som gjort högst (\d+) starter under (\d{4})\.$/)
  const continuousTraining = text.match(/^I oavbruten ([AB])-träning fr\.o\.m\. (\d{6})(,\s*körda av B- eller K- licensinnehavare(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?\.$/)
  const compoundRangeWithSecondarySuffix = text.match(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr((?: med högst \d+ poäng(?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen)?(?: i [AB]-träning)?|(?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen)(?: i [AB]-träning)?|,\s*körda av B- eller K- licensinnehavare(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?))\.$/)
  const compoundRangeSecondaryMin = text.match(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const compoundRangeEarnings = text.match(/^((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr samt ((?:\d-?åriga).+?)\s+([\d.]+) - ([\d.]+) kr\.$/)
  const genericMaxWithSuffix = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+högst\s+([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/)
  const genericMinWithSuffix = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/)
  const genericRangeWithSuffix = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?((?: som ej segrat| som kvarstår efter [a-zåäö]+ insatsen| som har högst \d+ seger(?:er)?| som har fullföljt minst \d+ totalisatorlopp fr\.o\.m\. .+?)(?: i [AB]-träning)?(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?| i [AB]-träning(?:,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)?|,\s*körda av (?:A- licensinnehavare|K- licensinnehavare|B- eller K- licensinnehavare)(?:\s+(?:EJ\s+)?anställd av A\/B-tränare)?)\.$/)
  const exactAgeRangeEarnings = text.match(/^(\d)-åriga ([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const maxEarnings = text.match(/^(\d)-åriga och äldre högst ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const minEarnings = text.match(/^(\d)-åriga och äldre lägst ([\d.]+) kr\.$/)
  const rangeEarnings = text.match(/^(\d)-åriga och äldre ([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const genericMaxEarnings = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+högst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const genericMinEarnings = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+lägst\s+([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const genericRangeEarnings = text.match(/^((?:\d(?:-\d+)?-?åriga)(?:.+?)?)\s+([\d.]+) - ([\d.]+) kr(?: med högst (\d+) poäng)?\.$/)
  const eligibilitySubjectOnly = text.match(/^(.+)\.$/)
  const startMethod = text.match(/\b(Autostart|Voltstart|Linjestart)\b/)
  const selectionSentence = text.match(/^Om fler än (\d+) hästar anmäls,? tas startande hästar ut i (P21-ordning|startpoängordning|poängordning)\.$/i)
  const forcedScratchingsNoRefund = text.match(/^Vid fler än (\d+) anmälda hästar tillämpas tvångsstrykning, gjorda insatser återbetalas ej\.$/i)
  const runnerCount = text.match(/\b(\d+)\s+startande\b/)
  const prizeLadder = text.match(/Pris:\s+([0-9.()]+(?:-[0-9.()]+)*)\s+(?:kr|samt)/)
  const amounts = [...text.matchAll(/\b(\d{1,3}(?:\.\d{3})+)\s+kr\b/g)].map(match => match[1])
  const placedCount = text.match(/\((\d+)\s+prisplacerade\)/)
  const premiumChancePercent = text.match(/För premiechansad häst adderas (\d+) % extra prispengar\./)
  const trackOrder = text.match(/ordning spår ([0-9,]+)\./)
  const stlTopSevenStartPoints = text.match(/^De sju hästar med högst startpoäng med ([\d. ]+) - ([\d. ]+) kr intjänat \(([^)]+)\) startar från distansen (\d{3,4}) meter (?:med|från) spår ([0-9-]+)\.$/i)
  const standingsUrl = text.match(/^Poängställning kan ses på (.+?)\.?$/i)
  const finalQualifiedHorsesUrl = text.match(/^Se finalklara hästar här: (.+?)\.?$/i)
  const finalStartBanPeriod = text.match(/^Häst som är inkvalad till finalen, men som inte startar där beläggs med startförbud under perioden (.+)\.$/i)
  const allowance = text.match(/^Tillägg\s+(.+?)(\.)?$/)
  const allowanceContinuation = text.match(/^(\d+\s+m\s+vid.+?)(\.)?$/)

  if (shortFinalNotice) {
    vars.track_name = shortFinalNotice[1]
    vars.date_text = shortFinalNotice[2]
  }
  if (threeQualifierFinalDistances) {
    vars.distance_m_1 = Number(threeQualifierFinalDistances[1])
    vars.distance_m_2 = Number(threeQualifierFinalDistances[2])
    vars.distance_m_3 = Number(threeQualifierFinalDistances[3])
  }
  if (dubbelCupMeetingIntro) {
    vars.meeting_number = Number(dubbelCupMeetingIntro[1])
    vars.meeting_schedule = dubbelCupMeetingIntro[2]
  }
  if (distance) vars.distance_m = Number(distance[1])
  if (finalPropositionTwoThresholdsRepeatedHv) {
    vars.distance_m = Number(finalPropositionTwoThresholdsRepeatedHv[1])
    vars.amount_kr_1 = finalPropositionTwoThresholdsRepeatedHv[2]
    vars.amount_kr_2 = finalPropositionTwoThresholdsRepeatedHv[3]
  }
  if (otherHorsesDistance) vars.distance_m = Number(otherHorsesDistance[1])
  if (underAgeDriversDistance) {
    vars.driver_age_limit = Number(underAgeDriversDistance[1])
    vars.distance_m = Number(underAgeDriversDistance[2])
  }
  if (breedType) vars.breed_type = breedType[1]
  if (propLabel) {
    vars.prop_number = propLabel[1]
    if (propLabel[2]) vars.prop_title = propLabel[2]
  }
  if (halfRowDate) vars.date_text = halfRowDate[1]
  if (rulePoint) vars.rule_point = Number(rulePoint[1])
  if (shortRulePoint) {
    vars.selection_count = Number(shortRulePoint[1])
    vars.rule_point = Number(shortRulePoint[2])
  }
  if (priorityGroup) vars.priority_group = priorityGroup[1]
  if (homeTrackAliasesOnly) vars.home_track_aliases = homeTrackAliasesOnly[1]
  if (homeHorseCount) vars.home_horse_count = Number(homeHorseCount[1])
  if (homeHorseCountWithAliases) {
    vars.home_horse_count = Number(homeHorseCountWithAliases[1])
    vars.home_track_aliases = homeHorseCountWithAliases[2]
  }
  if (wildcardAuthorityClause) {
    vars.wildcard_authority = wildcardAuthorityClause[1]
    vars.wildcard_action = wildcardAuthorityClause[2]
    vars.wildcard_award_phrase = wildcardAuthorityClause[3]
    vars.wildcard_context = wildcardAuthorityClause[4]
  }
  if (wildcardAwarded) vars.wildcard_recipients = wildcardAwarded[2]
  if (presentedBy) vars.presented_by_name = presentedBy[1]
  if (honoraryPrize) vars.honorary_prize_recipients = honoraryPrize[1]
  if (sponsoredHonoraryPrize) {
    vars.sponsor_name = sponsoredHonoraryPrize[1]
    vars.honorary_prize_recipients = sponsoredHonoraryPrize[2]
  }
  if (sponsoredHonorBlanketAndWreath) vars.sponsor_name = sponsoredHonorBlanketAndWreath[1]
  if (sponsoredHonorBlanket) vars.sponsor_name = sponsoredHonorBlanket[1]
  if (raceTitle) vars.race_title = raceTitle
  if (prefixedRaceTitle) {
    vars.title_prefix = prefixedRaceTitle.titlePrefix
    vars.race_title = prefixedRaceTitle.raceTitle
  }
  if (yearSuffixedRaceTitle) {
    vars.title_prefix = yearSuffixedRaceTitle.titlePrefix
    vars.race_title = yearSuffixedRaceTitle.raceTitle
    vars.title_year = yearSuffixedRaceTitle.titleYear
  }
  if (!vars.race_title && isGenericLTitle(text, propositionType)) {
    vars.race_title = text
  }
  if (driverCategory) vars.driver_category = Number(driverCategory[1])
  if (participantBirthBefore) {
    vars.participant_role = participantBirthBefore[1]
    vars.driver_birth_date = participantBirthBefore[2]
    vars.driver_race_limit = participantBirthBefore[3] ? ` med högst ${participantBirthBefore[3]} ${participantBirthBefore[4]} under ${participantBirthBefore[5]}` : ''
  }
  if (participantBirthRange) {
    vars.participant_role = participantBirthRange[1]
    vars.driver_birth_date_start = participantBirthRange[2]
    vars.driver_birth_date_end = participantBirthRange[3]
    vars.driver_race_limit = participantBirthRange[4] ? ` med högst ${participantBirthRange[4]} ${participantBirthRange[5]} under ${participantBirthRange[6]}` : ''
  }
  if (mergedDriverRestriction) {
    vars.participant_role = mergedDriverRestriction[1]
    vars.driver_birth_date = mergedDriverRestriction[2]
    vars.driver_race_limit = mergedDriverRestriction[3] ? ` med högst ${mergedDriverRestriction[3]} ${mergedDriverRestriction[4]} under ${mergedDriverRestriction[5]}` : ''
    vars.amount_min_kr = mergedDriverRestriction[6]
    vars.amount_max_kr = mergedDriverRestriction[7]
    vars.secondary_driver_race_limit = mergedDriverRestriction[8]
  }
  if (trainerStartLimit) {
    vars.trainer_start_limit = Number(trainerStartLimit[1])
    vars.trainer_start_year = Number(trainerStartLimit[2])
  }
  if (continuousTraining) {
    vars.training_code = continuousTraining[1]
    vars.training_since_date = continuousTraining[2]
    vars.eligibility_suffix = continuousTraining[3] || ''
  }
  if (compoundRangeWithSecondarySuffix) {
    vars.eligibility_subject = compoundRangeWithSecondarySuffix[1]
    vars.amount_min_kr = compoundRangeWithSecondarySuffix[2]
    vars.amount_max_kr = compoundRangeWithSecondarySuffix[3]
    vars.eligibility_subject_secondary = compoundRangeWithSecondarySuffix[4]
    vars.amount_secondary_min_kr = compoundRangeWithSecondarySuffix[5]
    vars.amount_secondary_max_kr = compoundRangeWithSecondarySuffix[6]
    vars.secondary_clause_suffix = compoundRangeWithSecondarySuffix[7]
  }
  if (compoundRangeSecondaryMin) {
    vars.eligibility_subject = compoundRangeSecondaryMin[1]
    vars.amount_min_kr = compoundRangeSecondaryMin[2]
    vars.amount_max_kr = compoundRangeSecondaryMin[3]
    vars.eligibility_subject_secondary = compoundRangeSecondaryMin[4]
    vars.amount_secondary_kr = compoundRangeSecondaryMin[5]
    vars.points_limit = compoundRangeSecondaryMin[6] ? ` med högst ${compoundRangeSecondaryMin[6]} poäng` : ''
  }
  if (compoundRangeEarnings) {
    vars.eligibility_subject = compoundRangeEarnings[1]
    vars.amount_min_kr = compoundRangeEarnings[2]
    vars.amount_max_kr = compoundRangeEarnings[3]
    vars.eligibility_subject_secondary = compoundRangeEarnings[4]
    vars.amount_secondary_min_kr = compoundRangeEarnings[5]
    vars.amount_secondary_max_kr = compoundRangeEarnings[6]
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && genericMaxWithSuffix) {
    vars.eligibility_subject = genericMaxWithSuffix[1]
    vars.amount_kr = genericMaxWithSuffix[2]
    vars.points_limit = genericMaxWithSuffix[3] ? ` med högst ${genericMaxWithSuffix[3]} poäng` : ''
    vars.eligibility_suffix = genericMaxWithSuffix[4]
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && genericMinWithSuffix) {
    vars.eligibility_subject = genericMinWithSuffix[1]
    vars.amount_kr = genericMinWithSuffix[2]
    vars.points_limit = genericMinWithSuffix[3] ? ` med högst ${genericMinWithSuffix[3]} poäng` : ''
    vars.eligibility_suffix = genericMinWithSuffix[4]
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && genericRangeWithSuffix) {
    vars.eligibility_subject = genericRangeWithSuffix[1]
    vars.amount_min_kr = genericRangeWithSuffix[2]
    vars.amount_max_kr = genericRangeWithSuffix[3]
    vars.points_limit = genericRangeWithSuffix[4] ? ` med högst ${genericRangeWithSuffix[4]} poäng` : ''
    vars.eligibility_suffix = genericRangeWithSuffix[5]
  }
  if (exactAgeRangeEarnings) {
    vars.age_exact = Number(exactAgeRangeEarnings[1])
    vars.amount_min_kr = exactAgeRangeEarnings[2]
    vars.amount_max_kr = exactAgeRangeEarnings[3]
    vars.points_limit = exactAgeRangeEarnings[4] ? ` med högst ${exactAgeRangeEarnings[4]} poäng` : ''
  }
  if (maxEarnings) {
    vars.age_min = Number(maxEarnings[1])
    vars.amount_kr = maxEarnings[2]
    vars.points_limit = maxEarnings[3] ? ` med högst ${maxEarnings[3]} poäng` : ''
  }
  if (minEarnings) {
    vars.age_min = Number(minEarnings[1])
    vars.amount_kr = minEarnings[2]
  }
  if (rangeEarnings) {
    vars.age_min = Number(rangeEarnings[1])
    vars.amount_min_kr = rangeEarnings[2]
    vars.amount_max_kr = rangeEarnings[3]
    vars.points_limit = rangeEarnings[4] ? ` med högst ${rangeEarnings[4]} poäng` : ''
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && !genericMaxWithSuffix && !maxEarnings && genericMaxEarnings) {
    vars.eligibility_subject = genericMaxEarnings[1]
    vars.amount_kr = genericMaxEarnings[2]
    vars.points_limit = genericMaxEarnings[3] ? ` med högst ${genericMaxEarnings[3]} poäng` : ''
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && !genericMinWithSuffix && !minEarnings && genericMinEarnings) {
    vars.eligibility_subject = genericMinEarnings[1]
    vars.amount_kr = genericMinEarnings[2]
    vars.points_limit = genericMinEarnings[3] ? ` med högst ${genericMinEarnings[3]} poäng` : ''
  }
  if (!compoundRangeWithSecondarySuffix && !compoundRangeSecondaryMin && !compoundRangeEarnings && !genericRangeWithSuffix && !exactAgeRangeEarnings && !rangeEarnings && genericRangeEarnings) {
    vars.eligibility_subject = genericRangeEarnings[1]
    vars.amount_min_kr = genericRangeEarnings[2]
    vars.amount_max_kr = genericRangeEarnings[3]
    vars.points_limit = genericRangeEarnings[4] ? ` med högst ${genericRangeEarnings[4]} poäng` : ''
  }
  if (!vars.eligibility_subject && eligibilitySubjectOnly && /(åriga|ston|kallblodiga|hingstar och valacker|svenska|norska|mockinländare)/i.test(eligibilitySubjectOnly[1])) {
    vars.eligibility_subject = eligibilitySubjectOnly[1]
  }
  if (startMethod) vars.start_method = startMethod[1]
  if (selectionSentence) {
    vars.selection_limit = Number(selectionSentence[1])
    vars.selection_order_basis = selectionSentence[2]
  }
  if (forcedScratchingsNoRefund) vars.selection_limit = Number(forcedScratchingsNoRefund[1])
  if (stlTopSevenStartPoints) {
    vars.amount_min_kr = stlTopSevenStartPoints[1]
    vars.amount_max_kr = stlTopSevenStartPoints[2]
    vars.stl_division = stlTopSevenStartPoints[3]
    vars.distance_m = Number(stlTopSevenStartPoints[4])
    vars.track_order = stlTopSevenStartPoints[5]
  }
  if (standingsUrl) vars.standings_url = standingsUrl[1]
  if (finalQualifiedHorsesUrl) vars.standings_url = finalQualifiedHorsesUrl[1]
  if (finalStartBanPeriod) vars.date_range_text = finalStartBanPeriod[1]
  if (runnerCount) vars.runner_count = Number(runnerCount[1])
  if (prizeLadder) vars.prize_ladder = prizeLadder[1]
  if (amounts.length) vars.amount_kr = amounts
  if (placedCount) vars.placed_count = Number(placedCount[1])
  if (premiumChancePercent) vars.premium_chance_percent = Number(premiumChancePercent[1])
  if (trackOrder) vars.track_order = trackOrder[1]
  if (allowance || allowanceContinuation) {
    const allowanceTerms = allowance?.[1] || allowanceContinuation?.[1]
    vars.allowance_terms = allowanceTerms
    vars.allowance_segments = parseAllowanceSegments(allowanceTerms)
  }

  return vars
}

function parseAllowanceSegments(value) {
  let text = normalizeWhitespace(value).replace(/\.$/, '')
  const noTrackReservation = /Spårförbehåll ej tillåtet$/.test(text)
  if (noTrackReservation) {
    text = normalizeWhitespace(text.replace(/Spårförbehåll ej tillåtet$/, ''))
  }

  const runnerCount = text.match(/\b(\d+)\s+startande$/)
  if (runnerCount) {
    text = normalizeWhitespace(text.replace(/\b\d+\s+startande$/, ''))
  }

  const segments = text
    .split(/\s*,\s*/)
    .map(part => normalizeWhitespace(part))
    .filter(Boolean)
    .map((part) => {
      let match = part.match(/^(\d+)\s+m\s+vid(?:\s+vunna)?\s+([\d.]+)\s+kr$/)
      if (match) {
        return { kind: 'earnings', distance_m: Number(match[1]), amount_kr: match[2] }
      }
      match = part.match(/^(\d+)\s+m\s+vid\s+([\d.]+)\s+poäng$/)
      if (match) {
        return { kind: 'points', distance_m: Number(match[1]), points: match[2] }
      }
      match = part.match(/^(\d+)\s+m\s+för\s+(.+)$/)
      if (match) {
        return { kind: 'category', distance_m: Number(match[1]), category: match[2] }
      }
      return { kind: 'raw', text: part }
    })

  return {
    segments,
    runner_count: runnerCount?.[1] ? Number(runnerCount[1]) : null,
    no_track_reservation: noTrackReservation
  }
}

function bump(map, key, patch = {}) {
  const current = map.get(key) || { count: 0, ...patch }
  current.count += 1
  for (const [patchKey, patchValue] of Object.entries(patch)) {
    if (current[patchKey] === undefined) current[patchKey] = patchValue
  }
  map.set(key, current)
  return current
}

function addExample(entry, example, limit = 5) {
  if (!entry.examples) entry.examples = []
  if (entry.examples.length < limit) entry.examples.push(example)
}

function byCountDescThenName(a, b) {
  return b.count - a.count || String(a.template || a.text).localeCompare(String(b.template || b.text), 'sv')
}

function pct(part, whole) {
  if (!whole) return 0
  return Number(((part / whole) * 100).toFixed(2))
}

function buildMarkdown(report) {
  const lines = [
    '# Proposition translation audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Scope',
    '',
    '- Source: MongoDB `winv75.racedays.raceList.propTexts`',
    '- Included types: all stored `propTexts` types',
    '- MongoDB was read only; no source proposition data was changed.',
    '',
    '## Coverage',
    '',
    `- Racedays scanned: ${report.summary.racedaysScanned}`,
    `- Races scanned: ${report.summary.racesScanned}`,
    `- Proposition text entries: ${report.summary.textEntries}`,
    `- Unique full texts: ${report.summary.uniqueFullTexts}`,
    `- Sentence entries: ${report.summary.sentenceEntries}`,
    `- Unique sentence templates: ${report.summary.uniqueSentenceTemplates}`,
    `- Matched sentence entries: ${report.summary.matchedSentenceEntries} (${report.summary.matchedSentenceCoveragePct}%)`,
    `- Matched unique sentence templates: ${report.summary.matchedUniqueTemplates} (${report.summary.matchedUniqueTemplateCoveragePct}%)`,
    '',
    '## Type summary',
    '',
    '| Type | Entries | Unique full texts | Sentence entries | Matched sentence entries | Coverage |',
    '| --- | ---: | ---: | ---: | ---: | ---: |'
  ]

  for (const item of report.byType) {
    lines.push(`| ${item.typ} | ${item.entries} | ${item.uniqueFullTexts} | ${item.sentenceEntries} | ${item.matchedSentenceEntries} | ${item.matchedSentenceCoveragePct}% |`)
  }

  lines.push(
    '',
    '## Top matched templates',
    '',
    '| Rule | Template | Count |',
    '| --- | --- | ---: |'
  )
  for (const item of report.matchedTemplates.slice(0, 20)) {
    lines.push(`| ${item.ruleId} | \`${item.template}\` | ${item.count} |`)
  }

  lines.push(
    '',
    '## Top unmatched templates',
    '',
    '| Type | Template | Count | Example |',
    '| --- | --- | ---: | --- |'
  )
  for (const item of report.unmatchedTemplates.slice(0, 30)) {
    const example = item.examples?.[0]?.sentence || ''
    lines.push(`| ${item.typ} | \`${item.template}\` | ${item.count} | ${example.replaceAll('|', '\\|')} |`)
  }

  lines.push(
    '',
    '## Confidence notes',
    '',
    ...report.confidenceNotes.map(note => `- ${note}`),
    '',
    '## Allowance parsing',
    '',
    '- `Tillägg` rows are parsed into structured earnings, points, category, runner-count, and no-track-reservation segments.',
    '- Finnish and English output renders those segments through deterministic phrase rules instead of carrying the Swedish source phrase as one raw variable.',
    '',
    '## Next UI implication',
    '',
    'The later WinV75 overview page should show this same matched/unmatched split per proposition and per language, using the rule ids as traceable quality evidence.'
  )

  return `${lines.join('\n')}\n`
}

async function loadRules() {
  return loadPropositionTranslationRules()
}

async function main() {
  dotenv.config({ path: path.join(REPO_ROOT, 'backend', '.env') })
  const rules = await loadRules()
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/winv75'

  await mongoose.connect(uri)
  const db = mongoose.connection.db
  const racedayCount = await db.collection('racedays').countDocuments()
  const cursor = db.collection('racedays').find(
    { 'raceList.propTexts': { $exists: true, $ne: [] } },
    {
      projection: {
        raceDayId: 1,
        raceDayDate: 1,
        trackName: 1,
        'raceList.raceId': 1,
        'raceList.raceNumber': 1,
        'raceList.propTexts': 1
      }
    }
  )

  const fullTexts = new Map()
  const sentenceTemplates = new Map()
  const matchedTemplates = new Map()
  const byType = new Map()

  let racesScanned = 0
  let textEntries = 0
  let sentenceEntries = 0
  let matchedSentenceEntries = 0

  for await (const raceday of cursor) {
    for (const race of raceday.raceList || []) {
      racesScanned += 1
      for (const propText of race.propTexts || []) {
        const typ = propText?.typ || '(missing)'
        const text = normalizeWhitespace(propText?.text)
        if (!text) continue

        textEntries += 1
        if (!byType.has(typ)) {
          byType.set(typ, {
            typ,
            entries: 0,
            uniqueFullTexts: new Set(),
            sentenceEntries: 0,
            matchedSentenceEntries: 0
          })
        }
        const typeStats = byType.get(typ)
        typeStats.entries += 1
        typeStats.uniqueFullTexts.add(text)

        const fullEntry = bump(fullTexts, `${typ}\u0000${text}`, { typ, text })
        addExample(fullEntry, {
          raceDayId: raceday.raceDayId,
          raceDayDate: raceday.raceDayDate,
          trackName: raceday.trackName,
          raceNumber: race.raceNumber,
          raceId: race.raceId
        })

        for (const sentence of splitSentences(text)) {
          sentenceEntries += 1
          typeStats.sentenceEntries += 1
          const template = normalizeTemplate(sentence, typ)
          const variables = extractVariables(sentence, typ)
          const rule = rules.sentenceRules.find(candidate => (
            candidate.types.includes(typ) && candidate.template === template
          ))
          const sentenceEntry = bump(sentenceTemplates, `${typ}\u0000${template}`, {
            typ,
            template,
            ruleId: rule?.id || null,
            matched: Boolean(rule)
          })
          addExample(sentenceEntry, {
            sentence,
            variables,
            raceDayId: raceday.raceDayId,
            raceDayDate: raceday.raceDayDate,
            trackName: raceday.trackName,
            raceNumber: race.raceNumber,
            raceId: race.raceId
          })

          if (rule) {
            matchedSentenceEntries += 1
            typeStats.matchedSentenceEntries += 1
            bump(matchedTemplates, rule.id, {
              ruleId: rule.id,
              template,
              types: rule.types
            })
          }
        }
      }
    }
  }

  await mongoose.disconnect()

  const templateList = [...sentenceTemplates.values()].sort(byCountDescThenName)
  const matchedList = [...matchedTemplates.values()].sort(byCountDescThenName)
  const unmatchedList = templateList.filter(item => !item.matched)
  const uniqueMatchedTemplates = templateList.filter(item => item.matched).length
  const uniqueFullTexts = fullTexts.size

  const report = {
    generatedAt: new Date().toISOString(),
    ruleVersion: rules.version,
    summary: {
      racedaysScanned: racedayCount,
      racesScanned,
      textEntries,
      uniqueFullTexts,
      sentenceEntries,
      uniqueSentenceTemplates: templateList.length,
      matchedSentenceEntries,
      matchedSentenceCoveragePct: pct(matchedSentenceEntries, sentenceEntries),
      matchedUniqueTemplates: uniqueMatchedTemplates,
      matchedUniqueTemplateCoveragePct: pct(uniqueMatchedTemplates, templateList.length)
    },
    byType: [...byType.values()].map(item => ({
      typ: item.typ,
      entries: item.entries,
      uniqueFullTexts: item.uniqueFullTexts.size,
      sentenceEntries: item.sentenceEntries,
      matchedSentenceEntries: item.matchedSentenceEntries,
      matchedSentenceCoveragePct: pct(item.matchedSentenceEntries, item.sentenceEntries)
    })),
    matchedTemplates: matchedList,
    unmatchedTemplates: unmatchedList,
    sentenceTemplates: templateList,
    uniqueFullTexts: [...fullTexts.values()].sort(byCountDescThenName),
    confidenceNotes: [
      'The rule set now includes all stored proposition text types; structural types such as U, T, P, and H have full coverage, while free-text-heavy V, EX, L, and FX continue to expose unmatched templates for rule expansion.',
      'Matched sentence-entry coverage is more important than unique-template coverage for cost control because recurring propositions dominate runtime volume.',
      'Finnish and English render strings are rule seeds and should be language-reviewed before production release, but allowance terms are now parsed into deterministic subsegments instead of preserved as one Swedish raw phrase.',
      'Unmatched sentences are intentionally visible in the audit and Propp menu so new rule candidates can be added by frequency.'
    ]
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  await fs.writeFile(JSON_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await fs.writeFile(MD_REPORT_PATH, buildMarkdown(report), 'utf8')

  console.log(JSON.stringify(report.summary, null, 2))
}

main().catch(async error => {
  try {
    await mongoose.disconnect()
  } catch {
    // Best-effort cleanup for failed audits.
  }
  console.error(error)
  process.exit(1)
})
