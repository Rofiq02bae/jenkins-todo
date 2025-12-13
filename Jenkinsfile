// Jenkinsfile (Declarative Pipeline)

pipeline {
    agent any

    environment {
        // --- VARIABLE UMUM CI ---
        IMAGE_NAME = "jenkins-todo-app" // Ganti dengan nama unik proyek baru
        REGISTRY = "docker.io/rofiq02bae"
        
        // --- KREDENSIAL JENKINS ID ---
        DOCKER_CREDS_ID = 'docker-hub-creds'
        SSH_CREDS_ID = 'deployment-ssh-server' 
        
        // --- VARIABLE DEPLOYMENT SERVER ---
        REMOTE_IP = "http://ec2-18-136-101-62.ap-southeast-1.compute.amazonaws.com/"
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
                // Asumsi: 'npm test' ada di package.json dan mengembalikan exit code non-nol jika gagal
                sh 'npm install'
                sh 'npm test' 
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
                        
                        echo "5. Deploying menggunakan Docker Compose ke ${REMOTE_IP}..."

                        // Perintah Deployment yang kompleks dikirim melalui SSH
                        sh """
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_IP} << 'DEPLOY_SCRIPT'
                                # Navigasi ke direktori deploy (misalnya di home user)
                                cd /home/${REMOTE_USER}/app_deployment || exit
                                
                                # Export variabel lingkungan yang dibutuhkan Docker Compose
                                export REGISTRY="${REGISTRY}"
                                export IMAGE_NAME="${IMAGE_NAME}"
                                export BUILD_NUMBER="${BUILD_NUMBER}"
                                export HOST_PORT="${HOST_PORT}"

                                # Pull image baru
                                docker pull ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}

                                # Jalankan deployment Docker Compose
                                # --force-recreate: Ganti kontainer lama dengan yang baru
                                # -d: Detached mode (background)
                                docker compose -f docker-compose.yml up --force-recreate -d app
                                
                                echo "Deployment selesai. Akses di http://${REMOTE_IP}:${HOST_PORT}"
DEPLOY_SCRIPT
                        """.stripIndent()
                    }
                }
            }
        }
    }
}
