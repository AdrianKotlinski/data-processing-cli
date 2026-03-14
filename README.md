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
9. +20 json-to-csv command works correctly (headers from object keys, values as rows, uses Streams)
Command to use: json-to-csv --input data.json --output data.csv
10. +12 count command works correctly (lines, words, characters counted via Streams, output format matches specification)
11. +12 hash command works correctly (SHA256 by default, supports md5 and sha512 via --algorithm option, uses Streams, supports --save to write hash file next to input)
12. +8 encrypt command works correctly (AES-256-GCM, key derivation from password+salt, Streams, output format matches spec)
13. +8 decrypt command works correctly (AES-256-GCM, key derivation from password+salt, Streams, authTag verified, result matches original)