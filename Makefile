# RD Bridge — simple local start (JSON DB).
# Usage: make play | make reset | make play-fresh

PORT ?= 3000
export PORT

.PHONY: help install reset kill-port play play-fresh seed-local play-demo verify-seed-json

help:
	@echo "make install     — npm install"
	@echo "make reset       — remove data/local-db.json and .next directory"
	@echo "make kill-port   — free PORT (default 3000)"
	@echo "make play        — free PORT; if data/local-db.json is missing, demo data is copied; npm run dev"
	@echo "make play-fresh  — reset + play (clean database and cache)"
	@echo "make seed-local  — copy data/demo-local-db.json -> data/local-db.json"
	@echo "make play-demo   — reset + seed-local + play (full local demo)"
	@echo "make verify-seed-json — count rows in demo JSON file"

seed-local:
	node scripts/build-demo-local-db.cjs
	cp data/demo-local-db.json data/local-db.json
	@echo "data/local-db.json updated with demo dataset."

play-demo: reset seed-local play

verify-seed-json:
	@node -e "const s=require('./data/demo-local-db.json'); console.log('companies',s.companies.length); console.log('briefs',s.briefs.length); console.log('researchers',s.researchers.length); console.log('researcher_projects',s.researcher_projects.length); console.log('applications',s.applications.length);"

install:
	npm install

reset:
	rm -f data/local-db.json
	rm -rf .next
	@echo "Done: clean local JSON database and no Next cache."

kill-port:
	@echo "Checking port $(PORT)..."
	@PIDS=$$(lsof -t -i:$(PORT) 2>/dev/null || true); \
	if [ -n "$$PIDS" ]; then \
		echo "Stopping process on port $(PORT): $$PIDS"; \
		kill -9 $$PIDS 2>/dev/null || true; \
		sleep 1; \
		echo "Port $(PORT) should now be free."; \
	else \
		echo "Port $(PORT) is free."; \
	fi

play: kill-port
	@if [ ! -f data/local-db.json ]; then \
		echo "data/local-db.json missing — copying demo dataset (matching supabase/seed.sql)."; \
		cp data/demo-local-db.json data/local-db.json; \
	fi
	USE_LOCAL_JSON_DB=true npm run dev -- -p $(PORT)

play-fresh: reset play
