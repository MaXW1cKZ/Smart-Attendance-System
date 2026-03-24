import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.users import User
from app.core.security import get_password_hash

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")


async def seed_data():
    if not DATABASE_URL:
        print("❌ Error: DATABASE_URL not found in .env file")
        return

    engine = create_async_engine(DATABASE_URL, echo=True)
    AsyncSessionLocal = sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )

    async with AsyncSessionLocal() as session:
        users_to_add = [
            User(
                email="admin1@kmitl.ac.th",
                hashed_password=get_password_hash("admin123"),
                full_name="System Admin",
                role="admin",
                is_active=True,
            ),
            User(
                email="teacher1@kmitl.ac.th",
                hashed_password=get_password_hash("teacher123"),
                full_name="Ajarn Somsak",
                role="teacher",
                is_active=True,
            ),
            User(
                email="teacher2@kmtil.ac.th",
                hashed_password=get_password_hash("teacher123"),
                full_name="Ajarn Wilai",
                role="teacher",
                is_active=True,
            ),
        ]

        try:
            session.add_all(users_to_add)
            await session.commit()
            print("Inserted Admin and Teachers successfully!")
        except Exception as e:
            await session.rollback()
            print(f"❌ Error: {e}")
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_data())
