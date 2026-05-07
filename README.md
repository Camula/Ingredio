# Ingredio

Ingredio to innowacyjna aplikacja webowa (Smart Fridge), która pomaga zarządzać składnikami w domowej lodówce oraz korzysta ze sztucznej inteligencji, aby generować pyszne, spersonalizowane przepisy na bazie tego, co aktualnie posiadasz. Zapomnij o marnowaniu jedzenia!

## 🚀 Funkcjonalności

- **Wirtualna Lodówka**: Dodawaj i usuwaj składniki, wspomagane inteligentnym systemem autouzupełniania ułatwiającym szybkie dodawanie produktów.
- **Generator Przepisów AI**: Szef Kuchni AI wymyśli dla Ciebie przepis dopasowany do wybranych składników z lodówki.
- **Smart Supplement**: Możesz zezwolić sztucznej inteligencji na dodanie maksymalnie 3 nowych składników do przepisu (poza podstawowymi składnikami jak woda czy przyprawy, które system domyślnie zakłada, że masz w kuchni). AI inteligentnie korzysta w pierwszej kolejności ze wszystkich składników z Twojej lodówki.
- **Ulubione**: Zapisuj swoje wygenerowane przepisy na później.

## 🛠️ Stack Technologiczny

Projekt działa jako **Monorepo** opierając się na następujących technologiach:

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Zod.
- **Backend**: Node.js, Express.js 5, TypeScript. Architektura mikroserwisów (`auth-service`, `fridge-service`, `recipe-service`).
- **Baza danych**: MongoDB (Mongoose).
- **AI**: OpenAI API (modele GPT ze zwracaniem w pełni strukturyzowanych obiektów JSON - Structured Outputs).
- **DevOps**: Docker, Docker Compose, pakiety współdzielone NPM workspaces.

## ⚙️ Uruchomienie lokalne (Docker)

Projekt jest całkowicie skonteneryzowany i działa jako zespół mikroserwisów uruchamiany jedną komendą.

### Wymagania:
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Utworzone konto i [Klucz API OpenAI](https://platform.openai.com/api-keys)

### Instrukcja:

1. **Sklonuj repozytorium**
   ```bash
   git clone <url-repozytorium>
   cd ingredio
   ```

2. **Zmienne środowiskowe**
   Skopiuj szablon `.env.example` i nazwij go `.env`:
   ```bash
   cp .env.example .env
   ```
   Otwórz plik `.env` i uzupełnij kluczowe zmienne (Twój prywatny klucz `OPENAI_API_KEY` oraz bezpieczne hasło `JWT_SECRET`).

3. **Zbuduj i uruchom za pomocą Docker Compose**
   ```bash
   docker compose up -d --build
   ```
   *Flaga `-d` uruchamia kontenery w tle. Użyj `docker compose logs -f` jeśli chcesz podejrzeć logi aplikacji.*

4. **Używaj!**
   - Wejdź na [http://localhost:5173](http://localhost:5173) by otworzyć interfejs klienta.

### Architektura Portów w Dockerze
- `5173`: Frontend (Vite)
- `3001`: Auth Service
- `3002`: Fridge Service
- `3003`: Recipe Service (wymaga OpenAI API)
- `27017`: MongoDB (Baza danych)

## 📝 Struktura Projektu

```
ingredio/
├── packages/
│   └── shared/               # Współdzielone modele, typy TypeScript oraz schematy Zod (np. dla przepisu AI)
├── services/
│   ├── auth-service/         # Logowanie, rejestracja, zarządzanie JWT i użytkownikami
│   ├── fridge-service/       # Zarządzanie składnikami, autouzupełnianie na bazie Fuse.js
│   ├── recipe-service/       # Komunikacja z OpenAI, prompt engineering, zarządzanie ulubionymi
│   └── frontend/             # Interfejs graficzny użytkownika (React 19)
├── docker-compose.yml        # Konfiguracja i łączenie usług Dockera
├── package.json              # Główne definicje skryptów i środowiska NPM workspaces
└── .env.example              # Szablon zmiennych systemowych
```
