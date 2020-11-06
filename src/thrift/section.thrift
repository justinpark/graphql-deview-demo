enum Layout {
  SINGLE_COLUMN = 0,
  SIDEBAR = 1
}

enum Placement {
  MAIN = 0,
  FLOATING_FOOTER = 1,
  TOP = 2,
  NAV = 3,
  SIDEBAR = 4
}

struct ScreenContainer {
  1: optional string id
  2: optional string name
  3: optional set<SectionPlacement> sectionPlacements
}

struct SectionPlacement {
  1: optional Layout layout
  2: optional Placement placement
  3: optional list<SectionDetail> sectionDetails
}

struct SectionDetail {
  1: optional string sectionId
  2: optional string border
}

struct SectionContainer {
  1: optional string id
  2: optional SectionComponentType sectionComponentType
  3: optional AvailableSection section
}

union AvailableSection {
  1: optional ProductCard card
  2: optional Title title
  3: optional Banner banner
}

enum SectionComponentType {
  BANNER = 0,
  TITLE = 1,
  CARD = 2
}

enum Icon {
  CHECK = 0,
  EXCLAMATION_CIRCLE = 1,
  BAN = 2,
  SMAILE = 3,
}

struct Banner {
  1: optional Icon icon
  2: optional string title
  3: optional string subtitle
  4: optional string ctaCopy
  5: optional string ctaUrl
}

struct Title {
  1: optional string title
  2: optional string subtitle
}

struct ProductCard {
  1: optional string title
  2: optional string subtitle
  3: optional string imageUrl
}