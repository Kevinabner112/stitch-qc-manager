import React from 'react';

const PhotoUploader = ({ photos, setPhotos }) => {
  const maxPhotos = 4;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (photos.length < maxPhotos) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Kompres gambar menjadi format JPEG dengan kualitas 70% agar ukurannya kecil
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setPhotos(prev => [...prev, compressedBase64]);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="mb-md">
      <label className="block text-body-md font-medium text-on-surface mb-xs">
        Photographic Evidence ({photos.length}/{maxPhotos})
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
        {photos.map((photoUrl, index) => (
          <div key={index} className="relative group rounded-lg overflow-hidden border border-outline-variant aspect-square">
            <img src={photoUrl} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(index)}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="rounded-lg border-2 border-dashed border-outline-variant bg-surface-container hover:bg-surface-container-high transition-colors aspect-square flex flex-col items-center justify-center text-on-surface-variant gap-xs cursor-pointer">
            <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
            <span className="text-label-caps uppercase">+ Tap to add</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  );
};

export default PhotoUploader;
