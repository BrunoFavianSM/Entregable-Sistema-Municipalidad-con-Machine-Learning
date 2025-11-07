import { useState } from 'react'
import { Upload, X, FileText, Image, Video, File } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FileUpload({ onFilesChange, maxFiles = 5, maxSize = 10 }) {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Video
    if (type.includes('pdf')) return FileText
    return File
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    
    // Validar número de archivos
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`)
      return
    }

    // Validar tamaño
    const maxSizeBytes = maxSize * 1024 * 1024
    const invalidFiles = selectedFiles.filter(file => file.size > maxSizeBytes)
    if (invalidFiles.length > 0) {
      toast.error(`Archivos muy grandes. Máximo ${maxSize}MB por archivo`)
      return
    }

    // Crear previews para imágenes
    const newPreviews = []
    for (const file of selectedFiles) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews.push({
            file: file.name,
            url: reader.result,
            type: 'image'
          })
          if (newPreviews.length === selectedFiles.filter(f => f.type.startsWith('image/')).length) {
            setPreviews([...previews, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      }
    }

    const newFiles = [...files, ...selectedFiles]
    setFiles(newFiles)
    onFilesChange(newFiles)
    toast.success(`${selectedFiles.length} archivo(s) agregado(s)`)
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    const newPreviews = previews.filter(p => {
      const fileIndex = files.findIndex(f => f.name === p.file)
      return fileIndex !== index
    })
    setFiles(newFiles)
    setPreviews(newPreviews)
    onFilesChange(newFiles)
    toast.success('Archivo eliminado')
  }

  return (
    <div className="space-y-4">
      {/* Zona de drop */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="file-upload"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Click para seleccionar archivos
          </p>
          <p className="text-xs text-gray-500">
            Imágenes, videos, PDF, Word, etc. (Máx. {maxSize}MB por archivo)
          </p>
        </label>
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {files.length} archivo(s) seleccionado(s):
          </p>
          <div className="space-y-2">
            {files.map((file, index) => {
              const IconComponent = getFileIcon(file.type)
              const preview = previews.find(p => p.file === file.name)
              
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  {/* Preview o icono */}
                  {preview ? (
                    <img
                      src={preview.url}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-gray-600" />
                    </div>
                  )}

                  {/* Info del archivo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          💡 <strong>Tip:</strong> Puedes subir documentos, fotos o videos que complementen tu solicitud.
          Formatos aceptados: JPG, PNG, PDF, Word, MP4, etc.
        </p>
      </div>
    </div>
  )
}
