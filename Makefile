# RD Bridge — prosty start lokalny (JSON DB).
# Użycie: make play | make reset | make play-fresh

PORT ?= 3000
export PORT

.PHONY: help install reset kill-port play play-fresh seed-local play-demo verify-seed-json

help:
	@echo "make install     — npm install"
	@echo "make reset       — usuń data/local-db.json i katalog .next"
	@echo "make kill-port   — zwolnij PORT (domyślnie 3000)"
	@echo "make play        — zwolnij PORT; jeśli brak data/local-db.json, kopiowane jest demo; npm run dev"
	@echo "make play-fresh  — reset + play (czysta baza i cache)"
	@echo "make seed-local  — skopiuj data/demo-local-db.json → data/local-db.json"
	@echo "make play-demo   — reset + seed-local + play (pełne demo lokalne)"
	@echo "make verify-seed-json — policz wiersze w pliku demo JSON"

seed-local:
	node scripts/build-demo-local-db.cjs
	cp data/demo-local-db.json data/local-db.json
	@echo "Plik data/local-db.json zaktualizowany zestawem demo."

play-demo: reset seed-local play

verify-seed-json:
	@node -e "const s=require('./data/demo-local-db.json'); console.log('companies',s.companies.length); console.log('briefs',s.briefs.length); console.log('researchers',s.researchers.length); console.log('researcher_projects',s.researcher_projects.length); console.log('applications',s.applications.length);"

install:
	npm install

reset:
	rm -f data/local-db.json
	rm -rf .next
	@echo "Gotowe: czysta lokalna baza JSON i brak cache Next."

kill-port:
	@echo "Sprawdzam port $(PORT)..."
	@PIDS=$$(lsof -t -i:$(PORT) 2>/dev/null || true); \
	if [ -n "$$PIDS" ]; then \
		echo "Kończę proces na porcie $(PORT): $$PIDS"; \
		kill -9 $$PIDS 2>/dev/null || true; \
		sleep 1; \
		echo "Port $(PORT) powinien być wolny."; \
	else \
		echo "Port $(PORT) jest wolny."; \
	fi

play: kill-port
	@if [ ! -f data/local-db.json ]; then \
		echo "Brak data/local-db.json — kopiuję zestaw demo (jak supabase/seed.sql)."; \
		cp data/demo-local-db.json data/local-db.json; \
	fi
	USE_LOCAL_JSON_DB=true npm run dev -- -p $(PORT)

play-fresh: reset play
