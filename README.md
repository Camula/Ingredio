# Ingredio: System Zarządzania Zapasami i Generacji Przepisów z Wykorzystaniem Sztucznej Inteligencji

Projekt został zrealizowany w ramach przedmiotu "Projekt zespołowy" na kierunku Informatyka. 

**Repozytorium projektu:** [Dodaj link do repozytorium GitHub/GitLab]

---

## 1. Cel Projektu

Głównym celem projektu było stworzenie w pełni funkcjonalnej, rozproszonej aplikacji webowej rozwiązującej problem marnowania żywności (Zero Waste). Z dydaktycznego punktu widzenia, projekt miał na celu:
- Praktyczne zastosowanie architektury mikroserwisowej w środowisku Node.js.
- Integrację systemów generatywnej sztucznej inteligencji (LLM) z aplikacją webową.
- Wykorzystanie konteneryzacji Docker do izolacji i wdrażania środowisk.
- Naukę projektowania oraz komunikacji w oparciu o architekturę REST API.
- Zdobycie doświadczenia w pracy zespołowej przy użyciu systemów kontroli wersji i ciągłej integracji.

---

## 2. Zespół Projektowy

| Imię i nazwisko | Rola w projekcie |
| :--- | :--- |
| **Karolina Studzienna** | Lider Projektu |
| **Kamil Jarzyna** | Programista |
| **Michał Neubauer** | Tester |
| **Kacper Kulon** | Architekt |

---

## 3. Główne Funkcjonalności

- **Zarządzanie wirtualnym inwentarzem (Smart Fridge):** Śledzenie stanu posiadanych produktów, ich ilości oraz jednostek miar.
- **Transkrypcja i przetwarzanie mowy:** Możliwość głosowego dodawania składników; system automatycznie rozpoznaje intencje, parsuje tekst i zasila bazę danych.
- **AI Recipe Generator:** Dynamiczne generowanie ustrukturyzowanych przepisów kulinarnych na podstawie aktualnego stanu "lodówki", z uwzględnieniem stopnia trudności, czasu przygotowania i diety.
- **Smart Supplement:** Algorytm dopuszczający wygenerowanie przepisu, do którego brakuje maksymalnie trzech składników głównych, zachęcając do optymalnych zakupów.
- **Grywalizacja (Gamifikacja):** System punktów doświadczenia (XP), odznak i utrzymywania passy ("streak") za proekologiczne zarządzanie zasobami.
- **Zarządzanie profilami:** Rejestracja, uwierzytelnianie i autoryzacja użytkowników.

---

## 4. Jak działa aplikacja (Przepływ Danych)

1. **Inicjalizacja Sesji:** Użytkownik loguje się do systemu (Frontend przesyła dane do `auth-service`, otrzymując w zamian token JWT).
2. **Aktualizacja Stanu:** Użytkownik wprowadza posiadane składniki poprzez interfejs tekstowy (wspierany przez mechanizm autouzupełniania Fuse.js) lub nagranie audio, które `recipe-service` zamienia na tekst i strukturyzuje za pomocą AI.
3. **Generacja:** Na żądanie użytkownika, Frontend wysyła wektor posiadanych składników (pobrany z `fridge-service`) do `recipe-service`.
4. **Interakcja z modelem językowym:** `recipe-service` konstruuje zaawansowany prompt i komunikuje się z API OpenAI.
5. **Prezentacja:** Zwrotna odpowiedź (wymuszona w formacie JSON poprzez Structured Outputs) jest parsowana i renderowana w interfejsie graficznym. Użytkownik może zapisać wygenerowany przepis do bazy ulubionych.

---

## 5. Architektura i Stos Technologiczny

Projekt zrealizowano w modelu **Monorepo** (zarządzanym przez NPM Workspaces), co ułatwia synchronizację kontraktów (interfejsów) między warstwami aplikacji.

### Frontend (Aplikacja Kliencka SPA)
- **Framework:** React 19, TypeScript
- **Narzędzie budujące:** Vite 8
- **Warstwa wizualna:** Tailwind CSS 4, Framer Motion
- **Komunikacja:** Axios, Context API

### Backend (Mikroserwisy)
- **Środowisko:** Node.js 20, Express.js 5, TypeScript
- **Baza danych:** MongoDB (dostęp przez Mongoose 8)
- **Moduły usługowe:** 
  - `auth-service` (Logika tożsamości)
  - `fridge-service` (Logika zasobów)
  - `recipe-service` (Logika zewnętrznego API i AI)
- **Współdzielenie logiki:** Pakiet `@ingredio/shared` (walidacja schematów oparta o bibliotekę **Zod**).

---

## 6. Autoryzacja i API

- **Uwierzytelnianie:** Zrealizowane bezstanowo przy wykorzystaniu **JSON Web Tokens (JWT)**. Hasła w bazie danych są solone i haszowane przy użyciu algorytmu **BcryptJS**.
- **Dokumentacja API:** Każdy z mikroserwisów posiada własną, automatycznie generowaną dokumentację opartą o specyfikację OpenAPI. Interfejs **Swagger UI** dostępny jest lokalnie pod endpointem `/api-docs` dla poszczególnych usług.

---

## 7. Zapewnienie Jakości i Testowanie

Proces zapewnienia jakości (QA) został potraktowany priorytetowo. W projekcie wykorzystano środowisko testowe **Vitest**.

**Wykorzystane techniki i rodzaje testów:**
- Testy jednostkowe (Unit Testing)
- Testy integracyjne (Integration Testing)
- Testy end-to-end (E2E)
- Analiza statyczna kodu (ESLint, TypeScript Compiler)

**Główne ścieżki i funkcjonalności objęte testami:**
- Proces logowania i rejestracji użytkownika.
- Weryfikacja poprawności generacji i autoryzacji tokenów JWT.
- Prawidłowość odpowiedzi i obsługa błędów na kluczowych endpointach API.
- Komunikacja z usługą OpenAI i walidacja struktury zwracanych przepisów.
- Integracja i wymiana danych na linii Frontend ↔ Backend.

---

## 8. Środowisko Uruchomieniowe (Docker) i Instalacja

Aplikacja jest w pełni skonteneryzowana. 

### Wymagania wstępne:
- Zainstalowany Docker Engine i Docker Compose.
- Klucz API z platformy OpenAI.

### Instrukcja uruchomienia:
1. Pobranie repozytorium.
2. Skopiowanie pliku konfiguracyjnego środowiska:
   ```bash
   cp .env.example .env
   ```
3. Konfiguracja zmiennych `OPENAI_API_KEY` oraz `JWT_SECRET` w pliku `.env`.
4. Zbudowanie i uruchomienie kontenerów w tle:
   ```bash
   docker compose up -d --build
   ```
5. Aplikacja dostępna jest pod adresem: `http://localhost:5173`

---

## 9. Ciągła Integracja i Wdrażanie (CI/CD)

Projekt wykorzystuje system **GitHub Actions** do automatyzacji procesów deweloperskich.

**Konfiguracja Pipeline'u:**
- **Wyzwalacze (Triggers):** Akcje `push` do głównej gałęzi oraz tworzenie `pull request`.
- **Zakres (Stages):**
  1. Budowa aplikacji (Build) i weryfikacja statyczna TypeScript.
  2. Linting (ESLint) sprawdzający zgodność z ustalonymi konwencjami.
  3. Uruchomienie zautomatyzowanych zestawów testów.
  4. Ogólna kontrola jakości kodu zapobiegająca integracji błędnych zmian do repozytorium.

---

## 10. Możliwości Dalszego Rozwoju

Architektura systemu pozwala na jego łatwą rozbudowę. Zidentyfikowano następujące wektory potencjalnego rozwoju:
- **Aplikacja Mobilna:** Stworzenie dedykowanego klienta dla systemów iOS/Android (np. React Native).
- **Computer Vision (OCR):** Automatyczne skanowanie paragonów lub zdjęć wnętrza lodówki w celu wprowadzania produktów bez udziału klawiatury/głosu.
- **Asystent Dietetyczny AI (Nutrition Assistant):** Integracja zaawansowanych algorytmów śledzenia makro i mikroskładników oraz planowanie kaloryczności.
- **Rekomendacje Dietetyczne:** System podpowiedzi bazujący na chorobach, alergiach (np. celiakia) czy preferencjach użytkownika (np. dieta keto).
- **Integracja E-commerce:** Automatyczne tworzenie list zakupowych i przesyłanie ich do systemów zewnętrznych dostawców (zakupy online).
- **Pogłębiona Personalizacja:** Hiper-personalizacja przepisów uczenie się gustu kulinarnego użytkownika na podstawie jego historii i ocen generowanych potraw.