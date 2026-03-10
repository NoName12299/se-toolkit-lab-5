#!/usr/bin/env python3
"""Test script for ETL functions."""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from sqlmodel import SQLModel, create_engine, select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine

from app.etl import fetch_items, fetch_logs, load_items, load_logs, sync
from app.models.item import ItemRecord
from app.models.learner import Learner
from app.models.interaction import InteractionLog


async def test_with_sqlite():
    """Test ETL functions using in-memory SQLite."""
    # Create in-memory SQLite database for testing
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=True,
    )

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with AsyncSession(engine) as session:
        print("\n=== Testing fetch_items() ===")
        try:
            items = await fetch_items()
            print(f"Fetched {len(items)} items from API")
            for item in items[:5]:
                print(f"  - {item}")
        except Exception as e:
            print(f"fetch_items() error: {e}")
            items = []

        if items:
            print("\n=== Testing load_items() ===")
            try:
                new_count = await load_items(items, session)
                print(f"Loaded {new_count} new items into database")

                # Verify items were loaded
                result = await session.exec(select(ItemRecord))
                db_items = result.all()
                print(f"Total items in DB: {len(db_items)}")
                for item in db_items[:5]:
                    print(f"  - {item.type}: {item.title}")
            except Exception as e:
                print(f"load_items() error: {e}")

        print("\n=== Testing fetch_logs() ===")
        try:
            logs = await fetch_logs(since=None)
            print(f"Fetched {len(logs)} logs from API")
            if logs:
                print(f"First log: {logs[0]}")
        except Exception as e:
            print(f"fetch_logs() error: {e}")
            logs = []

        if logs and items:
            print("\n=== Testing load_logs() ===")
            try:
                new_count = await load_logs(logs, items, session)
                print(f"Loaded {new_count} new interactions into database")

                # Verify interactions were loaded
                result = await session.exec(select(InteractionLog))
                db_logs = result.all()
                print(f"Total interactions in DB: {len(db_logs)}")
            except Exception as e:
                print(f"load_logs() error: {e}")

    print("\n=== All tests completed ===")


async def test_sync():
    """Test the full sync() function."""
    print("\n=== Testing sync() with SQLite ===")
    
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with AsyncSession(engine) as session:
        try:
            result = await sync(session)
            print(f"Sync result: {result}")
        except Exception as e:
            print(f"sync() error: {e}")

    print("=== Sync test completed ===")


if __name__ == "__main__":
    print("Testing ETL functions...")
    asyncio.run(test_with_sqlite())
    asyncio.run(test_sync())
