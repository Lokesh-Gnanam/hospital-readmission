import logging

def setup_logging():
    """
    Sets up application-wide logger format and level.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
