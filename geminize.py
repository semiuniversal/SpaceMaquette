import os
import sys
import datetime
import glob # Import glob for finding files matching a pattern

def delete_previous_output_files(identifier_tag="_CONCAT_PROJECT_.txt"):
    """
    Finds and deletes files in the current working directory matching the identifier pattern.
    """
    pattern_to_delete = f"*{identifier_tag}"
    current_directory = os.getcwd()
    found_files = glob.glob(os.path.join(current_directory, pattern_to_delete))

    if not found_files:
        print("No previous output files found to delete.")
        return

    print(f"Found previous output files matching '{pattern_to_delete}':")
    for filepath in found_files:
        try:
            os.remove(filepath)
            print(f"  Deleted: {os.path.basename(filepath)}")
        except OSError as e:
            print(f"  Error deleting {os.path.basename(filepath)}: {e}")
        except Exception as e:
            print(f"  Unexpected error deleting {os.path.basename(filepath)}: {e}")
    print("-" * 20) # Separator

def create_concatenated_file(start_directory, output_filename):
    """
    Recursively walks through a directory, reads files (excluding .db and images),
    and concatenates their content into a single output file with headers.

    Args:
        start_directory (str): The root directory to walk through.
        output_filename (str): The name of the file to write the output to.
    """
    if not os.path.isdir(start_directory):
        print(f"Error: Starting directory '{start_directory}' not found or is not a directory.")
        return

    # Define file extensions to exclude (lowercase with leading dot)
    db_extensions = ('.db',)
    image_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico', '.webp', '.tiff')
    excluded_extensions = db_extensions + image_extensions

    try:
        abs_output_filename = os.path.abspath(output_filename)
        with open(abs_output_filename, 'w', encoding='utf-8') as outfile:
            outfile.write(f"--- Contents concatenated from directory: {os.path.abspath(start_directory)} ---\n")
            outfile.write(f"--- Generated on: {datetime.date.today().strftime('%Y-%m-%d')} ---\n\n")
        print(f"Output will be saved to: {abs_output_filename}")
    except IOError as e:
        print(f"Error: Could not open output file '{abs_output_filename}' for writing. {e}")
        return
    except Exception as e:
         print(f"An unexpected error occurred opening output file '{abs_output_filename}': {e}")
         return

    file_count = 0
    error_count = 0
    skipped_db_count = 0
    skipped_image_count = 0

    for dirpath, dirnames, filenames in os.walk(start_directory):
        # Exclude common directories
        dirnames[:] = [d for d in dirnames if d not in ['.git', 'node_modules', '__pycache__', 'build', 'dist', '.vscode', '.idea']]

        for filename in filenames:
            lower_filename = filename.lower()

            # --- Perform exclusion check FIRST ---
            if lower_filename.endswith(excluded_extensions):
                relative_path_skipped = os.path.relpath(os.path.join(dirpath, filename), start_directory).replace(os.path.sep, '/')
                if lower_filename.endswith(db_extensions):
                    print(f"Skipping database file: {relative_path_skipped}")
                    skipped_db_count += 1
                elif lower_filename.endswith(image_extensions):
                    print(f"Skipping image file: {relative_path_skipped}")
                    skipped_image_count += 1
                continue # Skip to the next file immediately
            # --- End of exclusion check ---

            # --- Process allowed files ---
            full_path = os.path.join(dirpath, filename)
            relative_path = os.path.relpath(full_path, start_directory).replace(os.path.sep, '/')
            header = f"--- File: {relative_path} ---\n"

            try:
                # Open output file in append mode for each valid file's content
                with open(abs_output_filename, 'a', encoding='utf-8') as outfile:
                    outfile.write(header) # Write header only for non-skipped files
                    try:
                        # Try reading the input file
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as infile:
                            for line in infile:
                                outfile.write(line)
                        # Ensure a newline exists before adding spacing
                        outfile.write("\n\n")
                        file_count += 1
                        print(f"Added: {relative_path}")
                    except Exception as read_error:
                        # Log reading errors to the output file
                        error_message = f"--- Error reading file: {relative_path}. Reason: {read_error} ---\n\n"
                        outfile.write(error_message)
                        print(f"Error reading {relative_path}: {read_error}")
                        error_count += 1

            except IOError as e:
                print(f"Error: Could not append to output file '{abs_output_filename}'. {e}")
                # Consider stopping if output file becomes unwritable
                return
            except Exception as e:
                print(f"An unexpected error occurred processing {relative_path}: {e}")
                error_count += 1

    # Final summary
    print(f"\nFinished processing.")
    print(f"Successfully added content from {file_count} files.")
    if skipped_db_count > 0:
        print(f"Skipped {skipped_db_count} database (.db) files.")
    if skipped_image_count > 0:
        print(f"Skipped {skipped_image_count} image files ({', '.join(image_extensions)}).")
    if error_count > 0:
        print(f"Encountered errors with {error_count} files (see details above and in the output file).")
    print(f"Output saved to: {abs_output_filename}")


if __name__ == "__main__":
    print("--- Directory to Text File Concatenator (v4: Auto-delete previous, excludes .db & images) ---")

    # --- Add identifier tag ---
    output_file_identifier = "_CONCAT_PROJECT_.txt"

    # --- Delete previous output files ---
    print("\nChecking for previous output files...")
    delete_previous_output_files(output_file_identifier)

    # --- Get input directory ---
    while True:
        start_dir = input("Enter the full path to the root directory of your project: ")
        start_dir = os.path.normpath(start_dir)
        if os.path.isdir(start_dir):
            break
        else:
            print("Invalid directory path. Please try again.")

    # --- Generate new output filename ---
    dir_basename = os.path.basename(start_dir)
    if not dir_basename:
        dir_basename = 'root_drive'
    current_date = datetime.date.today().strftime('%Y-%m-%d')
    # Add the identifier to the filename
    output_file = f"{dir_basename}_{current_date}{output_file_identifier}"

    # --- Run the concatenation ---
    create_concatenated_file(start_dir, output_file)