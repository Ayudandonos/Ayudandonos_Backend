# Base de datos — Ayudandonos Backend

Estado del esquema: **Perfil donante + coordenadas de fundaciones** (sobre Fase 5).

Motor: PostgreSQL. ORM: Prisma.

## Diagrama ER (modulo Fundaciones)

```mermaid
erDiagram
  users ||--o| foundations : "1:1"
  foundations ||--o{ foundation_social_links : "has"
  foundations ||--o{ foundation_documents : "has"
  foundations ||--o{ foundation_admin_observations : "has"
  users ||--o{ foundation_admin_observations : "author"

  users {
    uuid id PK
    string email UK
    string password_hash
    string full_name
    enum role
    boolean is_active
    string phone
    string city
    string department
    string bio
    string avatar_url
    datetime created_at
    datetime updated_at
  }

  foundations {
    uuid id PK
    uuid user_id FK,UK
    string name
    string acronym
    string nit UK
    string category
    text mission
    text vision
    text description
    string city
    string department
    string address
    float latitude
    float longitude
    string institutional_email
    string phone
    string website
    string legal_representative_name
    string legal_representative_document
    string logo_url
    enum status
    datetime verified_at
    datetime rejected_at
    text rejection_reason
    text admin_notes
    datetime created_at
    datetime updated_at
  }

  foundation_social_links {
    uuid id PK
    uuid foundation_id FK
    enum network
    string url
    datetime created_at
    datetime updated_at
  }

  foundation_documents {
    uuid id PK
    uuid foundation_id FK
    enum type
    string file_url
    string file_name
    string mime_type
    int file_size
    datetime uploaded_at
    datetime updated_at
  }

  foundation_admin_observations {
    uuid id PK
    uuid foundation_id FK
    uuid author_id FK
    text content
    datetime created_at
  }
```

## Enums

### FoundationStatus

| Valor | Uso |
| ----- | --- |
| PENDING | Registro o revision |
| VERIFIED | Visible publicamente |
| REJECTED | Solicitud rechazada |
| SUSPENDED | Suspendida por admin |

### FoundationDocumentType

| Valor | Obligatorio para verificar |
| ----- | -------------------------- |
| RUT | Si |
| LEGAL_EXISTENCE_CERTIFICATE | Si |
| LEGAL_REPRESENTATIVE_ID | Si |
| BANK_CERTIFICATION | No |

### SocialNetworkType

`FACEBOOK`, `INSTAGRAM`, `X`, `LINKEDIN`, `YOUTUBE`, `TIKTOK`, `OTHER`

## Indices

- `foundations`: `status`, `category`, `city`, `department`
- `foundation_admin_observations`: `(foundation_id, created_at)`
- `campaigns`: `foundation_id`, `status`, `start_date`, `end_date`
- `donations`: `donor_user_id`, `status` (stats de donante)

## Migraciones relevantes

| Carpeta | Descripcion |
| ------- | ----------- |
| `20250710180000_foundation_extended_profile` | Schema extendido, enum status, redes y documentos |
| `20250710190000_foundation_acronym_observations` | Sigla (`acronym`) e historial de observaciones admin |
| `20260720190000_campaigns` | Tabla `campaigns` y enum `CampaignStatus` |
| `20260720210000_campaigns_needs_donations` | Needs, Donations, Conversation, Message, historial |
| `20260722010000_notifications` | Tabla `notifications` y enum `NotificationType` |
| `20260722020000_user_profile_fields` | Perfil donante: phone, city, department, bio, avatar_url |
| `20260722030000_foundation_coordinates` | Coordenadas latitude/longitude en fundaciones |

## Extension futura

El modelo de `foundations` y `campaigns` esta disenado para soportar modulos posteriores sin refactor mayor:

- **Storage**: URLs de imagenes/documentos hacia Blob/S3
- **Voluntariado**: perfil de fundacion como ancla organizacional
- **Reportes**: agregaciones por `status`, `category`, `city`, `department`

No eliminar campos de perfil al agregar necesidades; mantener separacion entre identidad organizacional (fundacion) y operacion (campanas).

Catalogo de endpoints: `docs/API_REFERENCE.md`.
