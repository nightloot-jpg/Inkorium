export function uploadBlobWithProgress(
  uploadUrl: string,
  file: Blob,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) { settled = true; onProgress(100); resolve(); return; }
      fail(new Error(xhr.responseText || `El almacenamiento de media rechazó la subida (${xhr.status}).`));
    });
    xhr.addEventListener('error', () => fail(new Error('El navegador no puede conectar con el almacenamiento de media. Comprueba la política CORS del bucket.')));
    xhr.addEventListener('abort', () => fail(new Error('La subida de media fue cancelada.')));
    xhr.send(file);
  });
}
