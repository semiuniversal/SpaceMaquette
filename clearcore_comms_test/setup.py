#!/usr/bin/env python3
"""
Setup script for the clearcore_comms_test package.
"""
from setuptools import setup, find_packages

setup(
    name="clearcore-comms-test",
    version="0.1.0",
    description="CLI tool for testing Ethernet communication with the ClearCore controller",
    author="Manus AI",
    packages=find_packages(),
    install_requires=[
        "click>=8.0.0",
        "rich>=10.0.0",
    ],
    entry_points={
        "console_scripts": [
            "clearcore-comms=clearcore_comms_test.cli:cli",
        ],
    },
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
)
