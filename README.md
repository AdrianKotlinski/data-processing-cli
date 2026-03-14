# data-processing-cli
RS node.js course - data-processing-cli

## What was done

### Basic Scope

1. +6 Application starts with npm run start and displays welcome message []
2. +10 Application exits gracefully with .exit command or Ctrl+C and displays goodbye message
3. +6 Current working directory is printed at startup and after each successful operation
4. +10 Unknown or invalid commands display Invalid input and application continues running


### NAvigation Commands

5. +8 up command moves up one directory level correctly
6. +8 cd command navigates to specified directory (both relative and absolute paths)
7. +12 ls command lists files and folders with proper sorting (folders first, then files, alphabetically)

### Data Processing Commands

8. +20 csv-to-json command works correctly (headers parsed, rows converted to objects, output is valid JSON array, uses Streams)
Command to use: csv-to-json --input data.csv --output data.json
