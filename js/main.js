// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJLtlVuT09dmdZFXoIhRMjxTM6OhF4h4I",
    authDomain: "control-system-b0840.firebaseapp.com",
    projectId: "control-system-b0840",
    storageBucket: "control-system-b0840.appspot.com",
    messagingSenderId: "742124164317",
    appId: "1:742124164317:web:720b077ee278f65df1b734"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Select the elements
var productName = document.getElementById("product-name");
var productPrice = document.getElementById("product-price");
var productCategory = document.getElementById("product-category");
var productImage = document.getElementById("product-image");
var productDescription = document.getElementById("product-description");
var addProductButton = document.getElementById("add-product-button");
var productList = document.getElementById("product-list");
var loader = document.getElementById("loader");

const addProductModeButton = document.getElementById('addProductModeButton');
const uploadFilesModeButton = document.getElementById('uploadFilesModeButton');
const addProductForm = document.getElementById('addProductForm');
const uploadFilesForm = document.getElementById('uploadFilesForm');
const folderUploadArea = document.getElementById('folderUploadArea');
const folderUploadInput = document.getElementById('folderUpload');
const fileList = document.getElementById('fileList');
const excelUploadInput = document.getElementById('excelUpload');
const excelFileName = document.getElementById('excelFileName');
const uploadFilesButton = document.getElementById('upload-files-button');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const uploadLoader = document.getElementById('uploadLoader');
const logBox = document.getElementById('logBox');

var listOfProducts = [];

// Initialize Bootstrap Modal
const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'), {
    backdrop: 'static',
    keyboard: false
});
const deleteProductNumber = document.getElementById('deleteProductNumber');
const deleteProductName = document.getElementById('deleteProductName');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');

// Initialize Usage Modal
const usageModal = new bootstrap.Modal(document.getElementById('usageModal'), {
    backdrop: 'static',
    keyboard: false
});

// Store the element that had focus before the modal opened
let previousActiveElement = null;

// Add event listeners for modal focus management
confirmDeleteModal._element.addEventListener('show.bs.modal', function() {
    previousActiveElement = document.activeElement;
    // Remove inert from modal when it's shown
    this.removeAttribute('inert');
});

usageModal._element.addEventListener('show.bs.modal', function() {
    previousActiveElement = document.activeElement;
    // Remove inert from modal when it's shown
    this.removeAttribute('inert');
});

confirmDeleteModal._element.addEventListener('shown.bs.modal', function() {
    // Focus the confirm button when modal is shown
    confirmDeleteButton.focus();
});

usageModal._element.addEventListener('shown.bs.modal', function() {
    // Focus the close button when modal is shown
    this.querySelector('.btn-close').focus();
});

confirmDeleteModal._element.addEventListener('hide.bs.modal', function() {
    // Add inert back to modal when it's hidden
    this.setAttribute('inert', '');
});

usageModal._element.addEventListener('hide.bs.modal', function() {
    // Add inert back to modal when it's hidden
    this.setAttribute('inert', '');
});

confirmDeleteModal._element.addEventListener('hidden.bs.modal', function() {
    // Return focus to the element that had focus before the modal opened
    if (previousActiveElement) {
        previousActiveElement.focus();
    }
});

usageModal._element.addEventListener('hidden.bs.modal', function() {
    // Return focus to the element that had focus before the modal opened
    if (previousActiveElement) {
        previousActiveElement.focus();
    }
});

// Load products from Firestore with sorting by createdAt
async function loadProducts() {
    loader.style.display = 'block';
    try {
        const snapshot = await db.collection('products')
            .orderBy('createdAt', 'asc')
            .get();
        listOfProducts = [];
        snapshot.forEach(doc => {
            listOfProducts.push({ id: doc.id, ...doc.data() });
        });
        displayProduct(listOfProducts);
    } catch (error) {
        console.error("Error loading products: ", error);
    } finally {
        loader.style.display = 'none';
    }
}

// Initial load
loadProducts();

function showValidationTooltip(proinput, isValid, message) {
    proinput.classList.remove("is-valid", "is-invalid");
    proinput.classList.add(isValid ? "is-valid" : "is-invalid");
    var parent = proinput.parentNode;
    var existingTooltip = parent.querySelector(".valid-tooltip, .invalid-tooltip");
    if (existingTooltip) {
        existingTooltip.remove();
    }
    var tooltip = document.createElement("div");
    tooltip.className = (isValid ? "valid-tooltip" : "invalid-tooltip") + " d-block";
    tooltip.textContent = message;
    parent.insertBefore(tooltip, proinput.nextSibling);
}

function validName(proName) {
    var regex = /^[A-Z][a-z]{2,9}[0-9]{0,3}$/;
    var isValid = regex.test(proName);
    var message = isValid ? "Looks good!" : "Name must start with a capital letter and have 2–9 lowercase letters, optionally followed by a 1-3 digits.";
    showValidationTooltip(productName, isValid, message);
    return isValid;
}

function validPrice(proPrice) {
    var regex = /^\d{1,6}(\.\d{1,2})?$/;
    var isFormatValid = regex.test(proPrice);
    var value = parseFloat(proPrice);
    var isValueInRange = value >= 0.01 && value <= 999999.99;
    var isValid = isFormatValid && isValueInRange;
    var message = isValid ? "Looks good!" : "Enter a value between 0.01 and 999999.99 (up to 2 decimal places).";
    showValidationTooltip(productPrice, isValid, message);
    return isValid;
}

function validCategory(proCatg) {
    var regex = /^[A-Z][a-z]{2,9}$/;
    var isValid = regex.test(proCatg);
    var message = isValid ? "Looks good!" : "Category must start with a capital letter and have 2–9 lowercase letters.";
    showValidationTooltip(productCategory, isValid, message);
    return isValid;
}

function validImageFile(proImg) {
    var file = proImg.files[0];
    var isValid = file && file.type.startsWith("image/");
    if (isValid) {
        if (document.getElementById("preview-image")) {
            document.getElementById("preview-image").remove();
        }
        previewImg = document.createElement("img");
        previewImg.id = "preview-image";
        previewImg.src = URL.createObjectURL(file);
        proImg.parentNode.insertBefore(previewImg, proImg.nextSibling);
    } else {
        if (document.getElementById("preview-image")) {
            document.getElementById("preview-image").remove();
        }
    }
    var message = isValid ? "Image looks good!" : "Please select a valid image file.";
    showValidationTooltip(productImage, isValid, message);
    return isValid;
}

function validExcelFile(excelFile) {
    var file = excelFile.files[0];
    var isValid = file && file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (isValid) {
        excelFileName.innerHTML = `<i class="fas fa-file-excel me-2"></i>${file.name}`;
    }
    else {
        excelFileName.innerHTML = '';
    }
    var message = isValid ? "Excel file looks good!" : "Please select a valid Excel file.";
    showValidationTooltip(excelUploadInput, isValid, message);
    return isValid;
}

function validDescription(proDesc) {
    var isValid = proDesc.trim().length >= 10;
    var message = isValid ? "Looks good!" : "Description should be at least 10 characters long.";
    showValidationTooltip(productDescription, isValid, message);
    return isValid;
}

// Loader functions
function showLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) {
        loader.classList.add('active');
    }
}

function hideLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) {
        loader.classList.remove('active');
    }
}

// Update addProduct function
async function addProduct() {
    try {
        showLoader('loader');
        if (!validName(productName.value) || !validCategory(productCategory.value) ||
            !validPrice(productPrice.value) || !validImageFile(productImage) ||
            !validDescription(productDescription.value)) {
            return;
        }

        addProductButton.disabled = true;
        const file = productImage.files[0];
        const storageRef = storage.ref(`products/${file.name}`);
        await storageRef.put(file);
        const imageUrl = await storageRef.getDownloadURL();

        var product = {
            name: productName.value,
            price: productPrice.value,
            category: productCategory.value,
            image: imageUrl,
            description: productDescription.value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('products').add(product);
        const doc = await docRef.get();
        const newProduct = { id: doc.id, ...doc.data() };
        listOfProducts.push(newProduct);

        document.querySelectorAll(".form-control").forEach(input =>
            input.classList.remove("is-valid", "is-invalid"));
        document.querySelectorAll(".valid-tooltip, .invalid-tooltip").forEach(tooltip =>
            tooltip.remove());
        document.getElementById("preview-image")?.remove();
        clearInputs();
        displayProduct(listOfProducts);
    } catch (error) {
        console.error('Error adding product:', error);
        showAlert('Error adding product. Please try again.', 'danger');
    } finally {
        hideLoader('loader');
        addProductButton.disabled = false;
    }
}

function updateFileList() {
    const allFiles = Array.from(folderUploadInput.files);

    const imageFiles = allFiles.filter(file => {
        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name);
        const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
        const isInMainOrSubFolder = pathParts.length <= 2;
        return isImage && isInMainOrSubFolder;
    });

    fileList.innerHTML = '';
    logBox.classList.add('d-none');
    logBox.className = 'alert d-none mt-3';

    if (imageFiles.length > 0) {
        fileList.innerHTML = '<ul>';
        for (let i = 0; i < Math.min(imageFiles.length, 5); i++) {
            const fileName = imageFiles[i].webkitRelativePath || imageFiles[i].name;
            fileList.innerHTML += `<li><i class="fas fa-image me-2"></i>${fileName}</li>`;
        }
        if (imageFiles.length > 5) {
            fileList.innerHTML += `<li>and ${imageFiles.length - 5} more images...</li>`;
        }
        fileList.innerHTML += '</ul>';
        folderUploadArea.querySelector('.upload-text').textContent = `${imageFiles.length} images selected successfully`;

        logBox.classList.remove('d-none');
        logBox.classList.add('alert-success');
        logBox.innerHTML = `<i class="fas fa-check-circle"></i> Found ${imageFiles.length} images in the folder`;
    } else {
        folderUploadArea.querySelector('.upload-text').textContent = 'Click to select folder or drag it here';

        if (allFiles.length > 0) {
            logBox.classList.remove('d-none');
            logBox.classList.add('alert-warning');
            logBox.innerHTML = '<i class="fas fa-exclamation-circle"></i> No images found in the selected folder. Make sure it contains jpg, png, gif, bmp, or webp files';
        } else {
            logBox.classList.remove('d-none');
            logBox.classList.add('alert-danger');
            logBox.innerHTML = '<i class="fas fa-times-circle"></i> Folder is empty or no folder selected';
        }
    }
}

// Update uploadBatch function
async function uploadBatch() {
    try {
        showLoader('uploadLoader');
        if (!validExcelFile(excelUploadInput)) {
            return;
        }
        const imageFiles = Array.from(folderUploadInput.files).filter(file =>
            /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name) &&
            file.webkitRelativePath.split('/').length === 2
        );
        const excelFile = excelUploadInput.files[0];

        if (!excelFile || imageFiles.length === 0) {
            logBox.classList.remove('d-none');
            logBox.classList.add('alert-danger');
            logBox.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please Upload an image folder.';
            return;
        }

        uploadFilesButton.disabled = true;
        progressContainer.classList.remove('d-none');
        progressBar.style.width = '0%';

        // Read Excel file
        const reader = new FileReader();
        const excelData = await new Promise((resolve) => {
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet);
                resolve(json);
            };
            reader.readAsArrayBuffer(excelFile);
        });

        // Validate Excel data
        const requiredFields = ['N', 'Name', 'Price', 'Category', 'Description'];
        const validProducts = excelData.filter(row =>
            requiredFields.every(field => row[field] !== undefined) &&
            typeof row.N === 'number' &&
            validName(row.Name) &&
            validPrice(String(row.Price)) &&
            validCategory(row.Category) &&
            validDescription(row.Description)
        );

        if (validProducts.length === 0) {
            logBox.classList.remove('d-none');
            logBox.classList.add('alert-danger');
            logBox.innerHTML = 'No valid data found in the Excel file.';
            return;
        }

        // Match images with Excel data based on N
        const productsToUpload = validProducts.map(row => {
            const image = imageFiles.find(file =>
                file.name === `${row.N}.jpg` ||
                file.name === `${row.N}.png` ||
                file.name === `${row.N}.jpeg` ||
                file.name === `${row.N}.gif` ||
                file.name === `${row.N}.bmp` ||
                file.name === `${row.N}.webp`
            );
            return { ...row, image };
        }).filter(product => product.image);

        if (productsToUpload.length === 0) {
            logBox.classList.remove('d-none');
            logBox.classList.add('alert-danger');
            logBox.innerHTML = 'No images found matching product numbers in Excel.';
            return;
        }

        // Upload products
        for (let i = 0; i < productsToUpload.length; i++) {
            const product = productsToUpload[i];
            const storageRef = storage.ref(`products/${product.image.name}`);
            await storageRef.put(product.image);
            const imageUrl = await storageRef.getDownloadURL();

            const productData = {
                name: product.Name,
                price: String(product.Price),
                category: product.Category,
                description: product.Description,
                image: imageUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await db.collection('products').add(productData);
            const doc = await docRef.get();
            listOfProducts.push({ id: doc.id, ...doc.data() });

            progressBar.style.width = `${((i + 1) / productsToUpload.length) * 100}%`;
        }

        logBox.classList.remove('d-none');
        logBox.classList.add('alert-success');
        logBox.innerHTML = '<i class="fas fa-check-circle"></i> Products uploaded successfully!';
        displayProduct(listOfProducts);
        clearUploadInputs();
    } catch (error) {
        console.error('Error uploading batch:', error);
        showAlert('Error uploading batch. Please try again.', 'danger');
    } finally {
        document.querySelectorAll(".form-control").forEach(input =>
            input.classList.remove("is-valid", "is-invalid"));
        document.querySelectorAll(".valid-tooltip, .invalid-tooltip").forEach(tooltip =>
            tooltip.remove());
        hideLoader('uploadLoader');
        uploadFilesButton.disabled = false;
        progressContainer.classList.add('d-none');
    }
}

function clearUploadInputs() {
    folderUploadInput.value = '';
    excelUploadInput.value = '';
    fileList.innerHTML = '';
    excelFileName.innerHTML = '';

    folderUploadArea.querySelector('.upload-text').textContent = 'Click to select folder or drag it here';
}

function clearInputs() {
    productName.value = "";
    productPrice.value = "";
    productCategory.value = "";
    productImage.value = "";
    productDescription.value = "";
}

function displayProduct(products) {
    var collection = '';
    for (var i = 0; i < products.length; i++) {
        collection += display(products[i], i);
    }
    productList.innerHTML = collection;
}

function searchProduct(searchInput) {
    var collection = '';
    for (let i = 0; i < listOfProducts.length; i++) {
        if (listOfProducts[i].name.toLowerCase().trim().includes(searchInput.toLowerCase().trim())) {
            collection += display(listOfProducts[i], i);
        }
    }
    productList.innerHTML = collection;
}

function display(prod, index) {
    return `
        <tr>
            <td scope="row">${index + 1}</td>
            <td><a href="${prod.image}" target="_blank"><img src="${prod.image}" alt="${prod.name}"></a></td>
            <td>${prod.name}</td>
            <td>$${prod.price}</td>
            <td>${prod.category}</td>
            <td>${prod.description}</td>
            <td>${prod.createdAt ? new Date(prod.createdAt.toDate()).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'N/A'}</td>
            <td>
                <button class="btn btn-info" onclick="updateProduct('${prod.id}', ${index})">Update</button>
                <button class="btn btn-danger" onclick="showDeleteModal('${prod.id}', ${index})">Delete</button>
            </td>
        </tr>
    `;
}

// Function to scroll to add product form
function scrollToAddProduct() {
    const addProductSection = document.getElementById('addProductSection');
    
    // Switch to Add Product mode
    showAddProductMode();
    
    // Smooth scroll to the form
    addProductSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Add highlight animation
    const addProductForm = document.getElementById('addProductForm');
    addProductForm.classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
        addProductForm.classList.remove('animate__animated', 'animate__pulse');
    }, 1000);
}

// Update the updateProduct function to include scrolling
function updateProduct(docId, index) {
    const product = listOfProducts[index];
    productName.value = product.name;
    productPrice.value = product.price;
    productCategory.value = product.category;
    productDescription.value = product.description;

    if (document.getElementById("preview-image")) {
        document.getElementById("preview-image").remove();
    }
    previewImg = document.createElement("img");
    previewImg.id = "preview-image";
    productImage.parentNode.insertBefore(previewImg, productImage.nextSibling);
    previewImg.src = product.image;
    window.oldImageUrl = product.image;
    window.docId = docId;

    addProductButton.innerHTML = "Update Product";
    addProductButton.classList.replace("btn-primary", "btn-info");
    addProductButton.removeAttribute("onclick");
    addProductButton.setAttribute("onclick", `updateProductList('${docId}', ${index})`);

    // Scroll to the form
    scrollToAddProduct();
}

async function updateProductList(docId, index) {
    if (!document.getElementById("preview-image")) {
        if (!validName(productName.value) || !validCategory(productCategory.value) ||
            !validPrice(productPrice.value) || !validImageFile(productImage) ||
            !validDescription(productDescription.value)) {
            return;
        }
    } else {
        if (!validName(productName.value) || !validCategory(productCategory.value) ||
            !validPrice(productPrice.value) || !validDescription(productDescription.value)) {
            return;
        }
    }

    loader.style.display = 'block';
    addProductButton.disabled = true;
    let imageUrl = window.oldImageUrl;
    try {
        const selectedFile = productImage.files[0];
        if (selectedFile) {
            if (window.oldImageUrl) {
                const oldImageRef = storage.refFromURL(window.oldImageUrl);
                await oldImageRef.delete();
            }
            const storageRef = storage.ref(`products/${selectedFile.name}`);
            await storageRef.put(selectedFile);
            imageUrl = await storageRef.getDownloadURL();
        }

        var product = {
            name: productName.value,
            price: productPrice.value,
            category: productCategory.value,
            image: imageUrl,
            description: productDescription.value,
            createdAt: listOfProducts[index].createdAt
        };

        await db.collection('products').doc(docId).set(product);
        listOfProducts[index] = { id: docId, ...product };

        document.querySelectorAll(".form-control").forEach(input =>
            input.classList.remove("is-valid", "is-invalid"));
        document.querySelectorAll(".valid-tooltip, .invalid-tooltip").forEach(tooltip =>
            tooltip.remove());
        document.getElementById("preview-image")?.remove();
        clearInputs();
        delete window.oldImageUrl;
        delete window.docId;

        addProductButton.innerHTML = "Add Product";
        addProductButton.classList.replace("btn-info", "btn-primary");
        addProductButton.removeAttribute("onclick");
        addProductButton.setAttribute("onclick", "addProduct()");
        displayProduct(listOfProducts);
    } catch (error) {
        console.error("Error updating product: ", error);
        showValidationTooltip(productImage, false, "Failed to update product. Try again.");
    } finally {
        loader.style.display = 'none';
        addProductButton.disabled = false;
    }
}

function showDeleteModal(docId, index) {
    const product = listOfProducts[index];
    deleteProductNumber.textContent = index + 1;
    deleteProductName.textContent = product.name;
    confirmDeleteButton.onclick = function () {
        deleteProduct(docId, index);
    };
    confirmDeleteModal.show();
}

async function deleteProduct(docId, index) {
    loader.style.display = 'block';
    try {
        // Delete image from Firebase Storage
        const imageUrl = listOfProducts[index].image;
        if (imageUrl) {
            const imageRef = storage.refFromURL(imageUrl);
            await imageRef.delete();
        }
        // Delete from Firestore
        await db.collection('products').doc(docId).delete();
        listOfProducts.splice(index, 1);
        // Clear form and UI
        document.querySelectorAll(".form-control").forEach(input =>
            input.classList.remove("is-valid", "is-invalid"));
        document.querySelectorAll(".valid-tooltip, .invalid-tooltip").forEach(tooltip =>
            tooltip.remove());
        document.getElementById("preview-image")?.remove();
        addProductButton.innerHTML = "Add Product";
        addProductButton.classList.replace("btn-info", "btn-primary");
        addProductButton.removeAttribute("onclick");
        addProductButton.setAttribute("onclick", "addProduct()");
        clearInputs();
        displayProduct(listOfProducts);
        confirmDeleteModal.hide();
    } catch (error) {
        console.error("Error deleting product: ", error);
    } finally {
        loader.style.display = 'none';
    }
}

function showAddProductMode() {
    addProductForm.classList.remove('d-none');
    uploadFilesForm.classList.add('d-none');
    addProductModeButton.classList.add('btn-primary');
    addProductModeButton.classList.remove('btn-secondary');
    uploadFilesModeButton.classList.add('btn-secondary');
    uploadFilesModeButton.classList.remove('btn-primary');
}

function showUploadFilesMode() {
    addProductForm.classList.add('d-none');
    uploadFilesForm.classList.remove('d-none');
    addProductModeButton.classList.add('btn-secondary');
    addProductModeButton.classList.remove('btn-primary');
    uploadFilesModeButton.classList.add('btn-primary');
    uploadFilesModeButton.classList.remove('btn-secondary');
}

addProductModeButton.addEventListener('click', showAddProductMode);
uploadFilesModeButton.addEventListener('click', showUploadFilesMode);

// Drag and Drop for folder
folderUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    folderUploadArea.style.borderColor = '#0d6efd';
    folderUploadArea.style.backgroundColor = 'rgba(13, 110, 253, 0.05)';
});

folderUploadArea.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

folderUploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!folderUploadArea.contains(e.relatedTarget)) {
        folderUploadArea.style.borderColor = '#6c757d';
        folderUploadArea.style.backgroundColor = '';
    }
});

folderUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    folderUploadArea.style.borderColor = '#6c757d';
    folderUploadArea.style.backgroundColor = '';

    const items = e.dataTransfer.items;
    const files = [];

    if (items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    if (entry.isDirectory) {
                        readDirectory(entry, files).then(() => {
                            const dt = new DataTransfer();
                            files.forEach(file => dt.items.add(file));
                            folderUploadInput.files = dt.files;
                            updateFileList();
                        });
                        return;
                    } else if (entry.isFile) {
                        entry.file(file => {
                            files.push(file);
                            if (files.length === items.length) {
                                const dt = new DataTransfer();
                                files.forEach(f => dt.items.add(f));
                                folderUploadInput.files = dt.files;
                                updateFileList();
                            }
                        });
                    }
                }
            }
        }
    }
    if (!items || items.length === 0) {
        folderUploadInput.files = e.dataTransfer.files;
        updateFileList();
    }
});

async function readDirectory(directoryEntry, files) {
    const directoryReader = directoryEntry.createReader();

    return new Promise((resolve, reject) => {
        function readEntries() {
            directoryReader.readEntries(async (entries) => {
                if (entries.length === 0) {
                    resolve();
                    return;
                }

                const promises = entries.map(entry => {
                    if (entry.isFile) {
                        return new Promise(resolve => {
                            entry.file(file => {
                                // إضافة webkitRelativePath للملف
                                Object.defineProperty(file, 'webkitRelativePath', {
                                    value: entry.fullPath.substring(1), // إزالة الشرطة المائلة في البداية
                                    writable: false
                                });
                                files.push(file);
                                resolve();
                            });
                        });
                    } else if (entry.isDirectory) {
                        return readDirectory(entry, files);
                    }
                });

                await Promise.all(promises);
                readEntries(); // قراءة المزيد من العناصر
            }, reject);
        }

        readEntries();
    });
}

folderUploadArea.addEventListener('click', () => {
    folderUploadInput.click();
});

folderUploadInput.addEventListener('change', updateFileList);

// Initial mode
showAddProductMode();

// Add animation classes to elements when they become visible
document.addEventListener('DOMContentLoaded', function() {
    // Add animation to form elements
    const formElements = document.querySelectorAll('.product-form > div');
    formElements.forEach((element, index) => {
        element.classList.add('animate__animated', 'animate__fadeIn');
        element.style.animationDelay = `${index * 0.1}s`;
    });

    // Add animation to table rows
    const tableRows = document.querySelectorAll('#product-list tr');
    tableRows.forEach((row, index) => {
        row.classList.add('animate__animated', 'animate__fadeIn');
        row.style.animationDelay = `${index * 0.1}s`;
    });

    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.classList.add('animate__animated', 'animate__pulse');
        });
        button.addEventListener('mouseleave', function() {
            this.classList.remove('animate__animated', 'animate__pulse');
        });
    });

    // Add animation to modal elements
    const usageModal = document.getElementById('usageModal');
    if (usageModal) {
        usageModal.addEventListener('show.bs.modal', function() {
            const modalContent = this.querySelector('.modal-content');
            modalContent.classList.add('animate__animated', 'animate__zoomIn');
        });
    }

    // Add animation to delete confirmation modal
    const deleteModal = document.getElementById('confirmDeleteModal');
    if (deleteModal) {
        deleteModal.addEventListener('show.bs.modal', function() {
            const modalContent = this.querySelector('.modal-content');
            modalContent.classList.add('animate__animated', 'animate__zoomIn');
        });
    }

    // Add animation to file upload area
    const uploadArea = document.getElementById('folderUploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('animate__animated', 'animate__pulse');
        });
        uploadArea.addEventListener('dragleave', function() {
            this.classList.remove('animate__animated', 'animate__pulse');
        });
        uploadArea.addEventListener('drop', function() {
            this.classList.remove('animate__animated', 'animate__pulse');
        });
    }

    // Add animation to search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            this.classList.add('animate__animated', 'animate__pulse');
        });
        searchInput.addEventListener('blur', function() {
            this.classList.remove('animate__animated', 'animate__pulse');
        });
    }
});

// Enhance the addProduct function with animations
const originalAddProduct = window.addProduct;
window.addProduct = function() {
    const button = document.getElementById('add-product-button');
    button.classList.add('animate__animated', 'animate__bounce');
    setTimeout(() => {
        button.classList.remove('animate__animated', 'animate__bounce');
        originalAddProduct();
    }, 300);
};

// Enhance the uploadBatch function with animations
const originalUploadBatch = window.uploadBatch;
window.uploadBatch = function() {
    const button = document.getElementById('upload-files-button');
    button.classList.add('animate__animated', 'animate__bounce');
    setTimeout(() => {
        button.classList.remove('animate__animated', 'animate__bounce');
        originalUploadBatch();
    }, 300);
};

// Enhance the searchProduct function with animations
const originalSearchProduct = window.searchProduct;
window.searchProduct = function(value) {
    const rows = document.querySelectorAll('#product-list tr');
    rows.forEach(row => {
        row.classList.remove('animate__animated', 'animate__fadeIn');
    });
    originalSearchProduct(value);
    setTimeout(() => {
        const newRows = document.querySelectorAll('#product-list tr');
        newRows.forEach((row, index) => {
            row.classList.add('animate__animated', 'animate__fadeIn');
            row.style.animationDelay = `${index * 0.1}s`;
        });
    }, 100);
};