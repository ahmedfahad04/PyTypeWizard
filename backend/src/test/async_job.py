#!/usr/bin/env python3

import asyncio


async def count(val1, val2):
    print(val1)
    await asyncio.sleep(5)
    print(val2)


async def main():
    val1 = "Start"
    val2 = "End"
    await asyncio.gather(count(val1, val2), count(val1, val2), count(val1, val2))


if __name__ == "__main__":
    import time

    s = time.perf_counter()
    asyncio.run(main())
    elapsed = time.perf_counter() - s
    print(f"{__file__} executed in {elapsed:0.2f} seconds.")

# #!/usr/bin/env python3

# import time


# def count():
#     print("One")
#     time.sleep(1)
#     print("Two")


# def main():
#     for _ in range(3):
#         count()


# if __name__ == "__main__":
#     s = time.perf_counter()
#     main()
#     elapsed = time.perf_counter() - s
#     print(f"{__file__} executed in {elapsed:0.2f} seconds.")
