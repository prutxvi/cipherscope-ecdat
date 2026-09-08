.PHONY: scan dev build preview deploy-railway clean

scan:
	python3 scanner/scanner.py demo-repo -o dashboard/src/findings.json

dev:
	cd dashboard && npm run dev

build:
	cd dashboard && npm run build

preview:
	cd dashboard && npm run preview

deploy-railway:
	cd dashboard && railway up

clean:
	find . -name __pycache__ -type d -exec rm -rf {} + 2>/dev/null; true
	rm -rf dashboard/dist
