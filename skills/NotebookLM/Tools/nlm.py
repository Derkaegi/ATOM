#!/usr/bin/env python3
"""
notebooklm.py — PAI CLI tool for Google NotebookLM
Usage: python3 notebooklm.py <subcommand> [options]

Subcommands:
  list                          List all notebooks
  create   --title TEXT         Create a new notebook
  sources  --notebook ID        List sources in a notebook
  artifacts --notebook ID       List generated artifacts
  add-url  --notebook ID --url URL [--wait]
  add-file --notebook ID --path PATH [--wait]
  add-text --notebook ID --text TEXT --title TEXT [--wait]
  ask      --notebook ID --question TEXT
  generate --notebook ID --type TYPE [--wait]
           Types: audio, report, study-guide, quiz, flashcards, infographic, mind-map, slide-deck
  download --notebook ID --artifact ID --out PATH
  login                         Open browser to authenticate
"""

import asyncio
import json
import sys
import argparse

try:
    from notebooklm import NotebookLMClient, AuthTokens
    from notebooklm.exceptions import AuthError
except ImportError:
    print(json.dumps({"error": "notebooklm-py not installed. Run: pip install 'notebooklm-py[browser]'"}))
    sys.exit(1)


def out(data):
    print(json.dumps(data, indent=2, default=str))


async def cmd_list():
    async with await NotebookLMClient.from_storage() as client:
        notebooks = await client.notebooks.list()
        out([{"id": nb.id, "title": nb.title} for nb in notebooks])


async def cmd_create(title):
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create(title)
        out({"id": nb.id, "title": nb.title})


async def cmd_sources(notebook_id):
    async with await NotebookLMClient.from_storage() as client:
        sources = await client.sources.list(notebook_id)
        out([{"id": s.id, "title": s.title, "type": str(s.type)} for s in sources])


async def cmd_artifacts(notebook_id):
    async with await NotebookLMClient.from_storage() as client:
        artifacts = await client.artifacts.list(notebook_id)
        out([{"id": a.id, "title": a.title, "type": str(a.type), "status": str(a.status)} for a in artifacts])


async def cmd_add_url(notebook_id, url, wait):
    async with await NotebookLMClient.from_storage() as client:
        source = await client.sources.add_url(notebook_id, url)
        if wait:
            source = await client.sources.wait_until_ready(notebook_id, source.id)
        out({"id": source.id, "title": source.title, "status": "ready" if wait else "processing"})


async def cmd_add_file(notebook_id, path, wait):
    async with await NotebookLMClient.from_storage() as client:
        source = await client.sources.add_file(notebook_id, path)
        if wait:
            source = await client.sources.wait_until_ready(notebook_id, source.id)
        out({"id": source.id, "title": source.title, "status": "ready" if wait else "processing"})


async def cmd_add_text(notebook_id, text, title, wait):
    async with await NotebookLMClient.from_storage() as client:
        source = await client.sources.add_text(notebook_id, text, title)
        if wait:
            source = await client.sources.wait_until_ready(notebook_id, source.id)
        out({"id": source.id, "title": source.title, "status": "ready" if wait else "processing"})


async def cmd_ask(notebook_id, question):
    async with await NotebookLMClient.from_storage() as client:
        result = await client.chat.ask(notebook_id, question)
        citations = []
        if hasattr(result, "citations") and result.citations:
            for c in result.citations:
                citations.append({"source": getattr(c, "title", str(c))})
        out({"answer": result.text, "citations": citations})


async def cmd_generate(notebook_id, gen_type, wait):
    async with await NotebookLMClient.from_storage() as client:
        t = gen_type.lower()
        if t == "audio":
            artifact = await client.artifacts.generate_audio(notebook_id, wait=wait)
        elif t == "report":
            artifact = await client.artifacts.generate_report(notebook_id, wait=wait)
        elif t == "study-guide":
            artifact = await client.artifacts.generate_study_guide(notebook_id, wait=wait)
        elif t == "quiz":
            artifact = await client.artifacts.generate_quiz(notebook_id, wait=wait)
        elif t == "flashcards":
            artifact = await client.artifacts.generate_flashcards(notebook_id, wait=wait)
        elif t == "infographic":
            artifact = await client.artifacts.generate_infographic(notebook_id, wait=wait)
        elif t == "mind-map":
            artifact = await client.artifacts.generate_mind_map(notebook_id, wait=wait)
        elif t == "slide-deck":
            artifact = await client.artifacts.generate_slide_deck(notebook_id, wait=wait)
        else:
            out({"error": f"Unknown type: {gen_type}. Use: audio, report, study-guide, quiz, flashcards, infographic, mind-map, slide-deck"})
            return
        out({"id": artifact.id, "title": artifact.title, "type": str(artifact.type), "status": str(artifact.status)})


async def cmd_download(notebook_id, artifact_id, out_path):
    async with await NotebookLMClient.from_storage() as client:
        data = await client.artifacts.download(notebook_id, artifact_id)
        with open(out_path, "wb") as f:
            f.write(data)
        out({"saved": out_path, "bytes": len(data)})


def cmd_login():
    import subprocess
    result = subprocess.run(["notebooklm", "login"], check=False)
    sys.exit(result.returncode)


def main():
    parser = argparse.ArgumentParser(description="PAI NotebookLM CLI")
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("list")
    sub.add_parser("login")

    p = sub.add_parser("create")
    p.add_argument("--title", required=True)

    p = sub.add_parser("sources")
    p.add_argument("--notebook", required=True)

    p = sub.add_parser("artifacts")
    p.add_argument("--notebook", required=True)

    p = sub.add_parser("add-url")
    p.add_argument("--notebook", required=True)
    p.add_argument("--url", required=True)
    p.add_argument("--wait", action="store_true")

    p = sub.add_parser("add-file")
    p.add_argument("--notebook", required=True)
    p.add_argument("--path", required=True)
    p.add_argument("--wait", action="store_true")

    p = sub.add_parser("add-text")
    p.add_argument("--notebook", required=True)
    p.add_argument("--text", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--wait", action="store_true")

    p = sub.add_parser("ask")
    p.add_argument("--notebook", required=True)
    p.add_argument("--question", required=True)

    p = sub.add_parser("generate")
    p.add_argument("--notebook", required=True)
    p.add_argument("--type", required=True, dest="gen_type")
    p.add_argument("--wait", action="store_true")

    p = sub.add_parser("download")
    p.add_argument("--notebook", required=True)
    p.add_argument("--artifact", required=True)
    p.add_argument("--out", required=True)

    args = parser.parse_args()

    if not args.cmd:
        parser.print_help()
        sys.exit(1)

    if args.cmd == "login":
        cmd_login()
        return

    try:
        if args.cmd == "list":
            asyncio.run(cmd_list())
        elif args.cmd == "create":
            asyncio.run(cmd_create(args.title))
        elif args.cmd == "sources":
            asyncio.run(cmd_sources(args.notebook))
        elif args.cmd == "artifacts":
            asyncio.run(cmd_artifacts(args.notebook))
        elif args.cmd == "add-url":
            asyncio.run(cmd_add_url(args.notebook, args.url, args.wait))
        elif args.cmd == "add-file":
            asyncio.run(cmd_add_file(args.notebook, args.path, args.wait))
        elif args.cmd == "add-text":
            asyncio.run(cmd_add_text(args.notebook, args.text, args.title, args.wait))
        elif args.cmd == "ask":
            asyncio.run(cmd_ask(args.notebook, args.question))
        elif args.cmd == "generate":
            asyncio.run(cmd_generate(args.notebook, args.gen_type, args.wait))
        elif args.cmd == "download":
            asyncio.run(cmd_download(args.notebook, args.artifact, args.out))
    except AuthError:
        out({"error": "Not authenticated. Run: python3 notebooklm.py login"})
        sys.exit(1)
    except Exception as e:
        out({"error": str(e), "type": type(e).__name__})
        sys.exit(1)


if __name__ == "__main__":
    main()
