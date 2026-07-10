# Base de datos — Ayudandonos Backend

Estado del esquema: **Fase 3 — Fundaciones extendidas**.

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

## Migraciones relevantes

| Carpeta | Descripcion |
| ------- | ----------- |
| `20250710180000_foundation_extended_profile` | Schema extendido, enum status, redes y documentos |
| `20250710190000_foundation_acronym_observations` | Sigla (`acronym`) e historial de observaciones admin |

## Extension futura

El modelo de `foundations` esta disenado para soportar modulos posteriores sin refactor mayor:

- **Campanas**: FK `foundation_id` en tabla futura `campaigns`
- **Necesidades / Donaciones**: relacion via campana o fundacion
- **Voluntariado**: perfil de fundacion como ancla organizacional
- **Reportes**: agregaciones por `status`, `category`, `city`, `department`

No eliminar campos de perfil al agregar campanas; mantener separacion entre identidad organizacional (fundacion) y operacion (campanas).
