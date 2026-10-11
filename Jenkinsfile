pipeline {
    agent any

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('2. Build & Deploy with Docker Compose') {
            steps {
                echo 'Bringing down old containers and spinning up new ones...'
                sh 'docker compose down'
                sh 'docker compose up -d --build'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully and application is running!'
        }
        failure {
            echo 'Pipeline failed. Check the console output for errors.'
        }
    }
}
