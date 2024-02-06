from flask import Flask, render_template, request, jsonify
import base64
import os
from pathlib import Path

app = Flask(__name__)

default_img_dir = os.path.join("static", "images")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/lines')
def lines():
    return render_template('lines.html')

@app.route('/get_images')
def get_images():
    input_dir = request.args.get('input_dir', '')
    img_dir = os.path.join(default_img_dir, 'input', input_dir)

    # Check if the directory exists
    if not os.path.exists(img_dir):
        return jsonify(error='Directory not found'), 404

    # Get all image files in the directory
    image_files = [f for f in os.listdir(img_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

    # Construct full paths for the images
    image_paths = [os.path.join(img_dir, file) for file in image_files]
    image_paths.sort()

    return jsonify(image_paths)

@app.route('/upload', methods=['POST'])
def upload():
    try:
        # Get the image data from the POST request
        image_data = request.form.get('image')
        output_dir = request.form.get('output_dir')
        file_name = request.form.get('file_name')

        # Decode the base64 image data
        image_data = base64.b64decode(image_data.split(',')[1])

        output_path = os.path.join(default_img_dir, 'annotated', output_dir)
        if not os.path.exists(output_path):
            os.makedirs(output_path)
        print(output_path)

        # Save the image to the static folder
        image_path = os.path.join(output_path, file_name)
        print(image_path)
        with open(image_path, 'wb') as f:
            f.write(image_data)

        return jsonify({'success': True, 'message': 'Image uploaded successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/image_has_annotation', methods=['GET'])
def image_has_annotation():
    try:
        # Get the input image path
        input_img_path = request.args.get('input_img_path', '')
        input_img_path = Path(input_img_path)

        if not input_img_path.exists():
            raise FileNotFoundError(f"{input_img_path} was not found")
        
        file_name = input_img_path.name
        phase_folder = input_img_path.parent
        data_folder = phase_folder.parent
        image_dir = data_folder.parent.parent
        print(image_dir)

        possible_annotation = Path(image_dir, "annotated", data_folder.name, phase_folder.name, file_name)
        print(possible_annotation)
        if possible_annotation.exists():
            return jsonify({'success': True, 'message': 'Annotation exists', 'annotationExistence': True})
        else:
            return jsonify({'success': True, 'message': 'Annotation does not exists', 'annotationExistence': False})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


if __name__ == '__main__':
    app.run(debug=True)
