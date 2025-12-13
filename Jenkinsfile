// Jenkinsfile (Declarative Pipeline)

pipeline {
    agent any

    environment {
        // --- VARIABLE UMUM CI ---
        IMAGE_NAME = "jenkins-todo-app" // Ganti dengan nama unik proyek baru
        REGISTRY = "docker.io/rofiq02bae"
        
        // --- KREDENSIAL JENKINS ID ---
        DOCKER_CREDS_ID = 'docker-hub-creds'
        SSH_CREDS_ID = 'depoyment-ssh-server' 
        
        // --- VARIABLE DEPLOYMENT SERVER ---
        REMOTE_IP = "ec2-18-136-101-62.ap-southeast-1.compute.amazonaws.com"
        REMOTE_USER = "ubuntu"
        HOST_PORT = 80             // Port publik di VM host
        CONTAINER_PORT = 3000      // Port internal aplikasi
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "1. Mengambil kode sumber dari GitHub."
            }
        }

        stage('Run Unit Tests') {
            steps {
                echo "2. Menjalankan pengujian unit (harus lulus sebelum build)."
                
                // Solusi: Jalankan npm install dan npm test dalam satu kontainer
                sh """
                    docker run --rm -v \$(pwd):/app -w /app node:20-alpine sh -c \
                        "npm install && npm test"
                """
            }
        }

        stage('Build Docker Image') {
            steps {
                // Docker build akan sangat cepat karena menggunakan Multi-Stage Build cache
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} ."
                echo "3. Image Docker ${IMAGE_NAME}:${BUILD_NUMBER} berhasil dibangun."
            }
        }

        stage('Push Image to Registry') {
            steps {
                script {
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}"
                    
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDS_ID, passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin ${REGISTRY.split('/')[0]}"
                    }

                    sh "docker push ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}"
                    echo "4. Image berhasil di-push."
                }
            }
        }
        
        stage('Deploy with Docker Compose') {
            steps {
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: SSH_CREDS_ID, keyFileVariable: 'SSH_KEY')]) {
                        
                        echo "5a. Menyalin file konfigurasi ke host..."
                        sh "scp -i ${SSH_KEY} -o StrictHostKeyChecking=no docker-compose.yml ${REMOTE_USER}@${REMOTE_IP}:/home/${REMOTE_USER}/app_deployment/docker-compose.yml"
                        
                        echo "5b. Melakukan deployment menggunakan Docker Compose ke ${REMOTE_IP}..."
                        
                        sh """
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_IP} << 'DEPLOY_SCRIPT'
                                # Navigasi ke direktori deploy 
                                cd /home/${REMOTE_USER}/app_deployment || exit
                                
                                # Export variabel lingkungan
                                export REGISTRY="${REGISTRY}"
                                export IMAGE_NAME="${IMAGE_NAME}"
                                export BUILD_NUMBER="${BUILD_NUMBER}"
                                export HOST_PORT="${HOST_PORT}"

                                # 1. PULL IMAGE TERBARU
                                docker pull ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}

                                # 2. HENTIKAN DAN HAPUS SERVICE LAMA (SOLUSI KONFLIK NAMA)
                                # --v (opsional) akan menghapus volume DB, gunakan hati-hati!
                                # Jika volume DB penting, gunakan: docker compose down
                                docker compose down

                                # 3. JALANKAN DEPLOYMENT BARU
                                # 'up -d' akan membuat ulang service yang diperlukan, termasuk DB jika belum ada.
                                docker compose -f docker-compose.yml up --force-recreate -d
                                
                                echo "Deployment selesai. Akses di http://${REMOTE_IP}:${HOST_PORT}"
DEPLOY_SCRIPT
                        """.stripIndent()
                    }
                }
            }
        }
    }
}
