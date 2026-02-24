import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/media');
    },
    filename: function (req, file, cb) {
        let fileExtension = '';
        if (file.originalname.split('.').length > 1) {
            fileExtension = file.originalname.substring(
                file.originalname.lastIndexOf('.'),
            );
        }
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e5);

        const filenameWithoutExtension = file.originalname
            .toLowerCase()
            .split(' ')
            .join('-')
            ?.split('.')[0];

        cb(null, filenameWithoutExtension + uniqueSuffix + fileExtension);
    },
});

export const fileUpload = multer({ storage: storage });
