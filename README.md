# Reto Admin Proxmox

Guía interactiva de retos para mejorar tus habilidades de administración de sistemas usando Proxmox 8.

## 📋 Retos Disponibles

### Nivel 1: El Forjador de Máquinas
_Domina Proxmox, la consola, y automatiza lo básico._

1. **Crea 3 VMs manualmente desde la GUI y desde la CLI.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Desde la GUI: Ve a 'Create VM', configura nombre, sistema operativo, disco y red.
   2. Desde CLI: Usa 'qm create [vmid] --memory [MB] --net0 virtio,bridge=vmbr0 --name [nombre]'.
   3. Añade un disco: 'qm set [vmid] --scsi0 local-lvm:10'.
   4. Importa ISO: 'qm set [vmid] --ide2 local:iso/debian-11.0.0-amd64-netinst.iso,media=cdrom'
   </details>

2. **Automatiza la creación de una VM con cloud-init.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Descarga imagen cloud: 'wget https://cloud-images.ubuntu.com/focal/current/focal-server-cloudimg-amd64.img'
   2. Crea VM: 'qm create 9000 --memory 2048 --net0 virtio,bridge=vmbr0'
   3. Importa disco: 'qm importdisk 9000 focal-server-cloudimg-amd64.img local-lvm'
   4. Configura disco: 'qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0'
   5. Añade cloud-init: 'qm set 9000 --ide2 local-lvm:cloudinit'
   6. Configura boot: 'qm set 9000 --boot c --bootdisk scsi0'
   7. Configura cloud-init: 'qm set 9000 --ciuser tu_usuario --cipassword tu_contraseña --ipconfig0 ip=dhcp'
   </details>

3. **Explora pvesh y haz un script que te liste el estado de todas las VMs.**
   <details>
   <summary>💡 Ver solución</summary>
   
   Script bash para listar VMs:
   ```bash
   #!/bin/bash
   echo "Estado de VMs en Proxmox:"
   echo "======================"
   pvesh get /cluster/resources --type vm | grep -v 'type|memory|maxdisk|maxmem' | awk '{print "VM ID: " $1 "\tNombre: " $2 "\tEstado: " $3}'
   ```
   Guárdalo como 'listar_vms.sh', dale permisos con 'chmod +x listar_vms.sh' y ejecútalo.
   </details>

4. **Configura backups programados (vzdump) + snapshots automáticos.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Configura backup desde GUI: Datacenter > Backup > Add
   2. Configura horario, almacenamiento y modo de compresión
   3. Para snapshots automáticos, crea script:
   ```bash
   #!/bin/bash
   # Crear snapshot antes de actualizaciones
   VMID=100 # Cambia por tu VMID
   SNAPNAME="pre-update-$(date +%Y%m%d)"
   qm snapshot $VMID $SNAPNAME -description "Snapshot automático pre-actualización"
   ```
   4. Programa con crontab: '0 2 * * 0 /ruta/al/script/snapshot.sh'
   </details>

5. **Instala un contenedor LXC optimizado (ej: Alpine o Debian mínimo).**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Descarga template: 'pveam update' y 'pveam available'
   2. Busca Alpine: 'pveam available | grep alpine'
   3. Descarga template: 'pveam download local alpine-3.16-default_20220622_amd64.tar.xz'
   4. Crea contenedor: 'pct create 200 local:vztmpl/alpine-3.16-default_20220622_amd64.tar.xz --hostname alpine-mini --memory 512 --net0 name=eth0,bridge=vmbr0,ip=dhcp'
   5. Inicia: 'pct start 200'
   6. Accede: 'pct enter 200'
   </details>

6. **Bonus: Script bash que clona una VM base, la renombra y la lanza.**
   <details>
   <summary>💡 Ver solución</summary>
   
   ```bash
   #!/bin/bash
   # Script para clonar VM base

   # Variables
   BASE_VMID=9000  # ID de tu VM base
   NEW_NAME=$1     # Primer argumento: nombre de la nueva VM

   if [ -z "$NEW_NAME" ]; then
     echo "Error: Debes proporcionar un nombre para la nueva VM"
     echo "Uso: $0 nombre_nueva_vm"
     exit 1
   fi

   # Encuentra el siguiente VMID disponible
   NEXT_ID=$(pvesh get /cluster/nextid)
   echo "Clonando VM $BASE_VMID a nueva VM $NEXT_ID con nombre $NEW_NAME"

   # Clona la VM
   qm clone $BASE_VMID $NEXT_ID --name $NEW_NAME

   # Inicia la VM
   qm start $NEXT_ID

   echo "VM $NEW_NAME creada con ID $NEXT_ID y iniciada correctamente"
   ```
   Guárdalo como 'clonar_vm.sh', dale permisos con 'chmod +x clonar_vm.sh' y ejecútalo con './clonar_vm.sh nombre_vm'
   </details>

### Nivel 2: VPN del Viajero
_Despliega y configura una VPN segura para acceder a tu Proxmox desde cualquier lugar._

1. **Instala y configura WireGuard en un contenedor o VM.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Crea un contenedor LXC Debian: 'pct create 201 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname wireguard-vpn --memory 512 --net0 name=eth0,bridge=vmbr0,ip=dhcp'
   2. Inicia y accede: 'pct start 201' y 'pct enter 201'
   3. Actualiza e instala: 'apt update && apt install -y wireguard iptables'
   4. Genera claves: 'wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey'
   5. Crea configuración: 'nano /etc/wireguard/wg0.conf'
   ```
   [Interface]
   Address = 10.0.0.1/24
   ListenPort = 51820
   PrivateKey = <contenido-de-privatekey>
   PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
   PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
   ```
   6. Habilita IP forwarding: 'echo 1 > /proc/sys/net/ipv4/ip_forward'
   7. Inicia WireGuard: 'wg-quick up wg0' y 'systemctl enable wg-quick@wg0'
   </details>

2. **Asegura acceso remoto solo desde claves públicas conocidas.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. En tu PC cliente, instala WireGuard y genera claves: 'wg genkey | tee privatekey | wg pubkey > publickey'
   2. En el servidor, edita la configuración: 'nano /etc/wireguard/wg0.conf'
   3. Añade la sección de peer con la clave pública del cliente:
   ```
   [Peer]
   PublicKey = <clave-publica-del-cliente>
   AllowedIPs = 10.0.0.2/32
   ```
   4. Reinicia WireGuard: 'systemctl restart wg-quick@wg0'
   5. Configura el cliente con la IP 10.0.0.2/24 y la clave pública del servidor
   </details>

3. **Testea la conexión desde fuera de tu red local.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Configura port forwarding en tu router: Puerto externo 51820 UDP -> IP del contenedor WireGuard puerto 51820
   2. Obtén tu IP pública: 'curl ifconfig.me'
   3. En la configuración del cliente, usa esta IP pública
   4. Conéctate desde una red móvil o externa
   5. Verifica la conexión: 'ping 10.0.0.1' y luego intenta acceder a la interfaz web de Proxmox
   </details>

4. **Crea un QR para añadir el túnel desde el móvil fácilmente.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Instala qrencode: 'apt install -y qrencode'
   2. Crea configuración para móvil:
   ```
   [Interface]
   PrivateKey = <clave-privada-del-movil>
   Address = 10.0.0.3/24
   DNS = 1.1.1.1, 8.8.8.8

   [Peer]
   PublicKey = <clave-publica-del-servidor>
   AllowedIPs = 10.0.0.0/24, 192.168.0.0/24
   Endpoint = <tu-ip-publica>:51820
   PersistentKeepalive = 25
   ```
   3. Genera QR: 'qrencode -t ansiutf8 < config-movil.conf'
   4. Escanea con la app WireGuard en tu móvil
   </details>

5. **Automatiza la creación de nuevos peers con un script.**
   <details>
   <summary>💡 Ver solución</summary>
   
   ```bash
   #!/bin/bash
   # Script para añadir nuevos peers a WireGuard

   if [ -z "$1" ]; then
     echo "Uso: $0 <nombre_cliente>"
     exit 1
   fi

   CLIENT_NAME=$1
   CONFIG_DIR="/etc/wireguard/clients"
   SERVER_PUBKEY=$(cat /etc/wireguard/publickey)
   SERVER_IP="$(curl -s ifconfig.me)"

   # Crear directorio si no existe
   mkdir -p $CONFIG_DIR

   # Generar claves para el cliente
   UMASK=077
   private_key="$(wg genkey)"
   public_key="$(echo $private_key | wg pubkey)"

   # Encontrar siguiente IP disponible
   last_ip=$(grep -h "AllowedIPs" /etc/wireguard/wg0.conf | sort | tail -n 1 | grep -oE '10\.0\.0\.[0-9]+')
   if [ -z "$last_ip" ]; then
     next_ip="10.0.0.2"
   else
     last_num=$(echo $last_ip | cut -d. -f4)
     next_num=$((last_num + 1))
     next_ip="10.0.0.$next_num"
   fi

   # Crear configuración del cliente
   cat > "$CONFIG_DIR/$CLIENT_NAME.conf" << EOF
   [Interface]
   PrivateKey = $private_key
   Address = $next_ip/24
   DNS = 1.1.1.1, 8.8.8.8

   [Peer]
   PublicKey = $SERVER_PUBKEY
   AllowedIPs = 10.0.0.0/24, 192.168.0.0/24
   Endpoint = $SERVER_IP:51820
   PersistentKeepalive = 25
   EOF

   # Añadir peer al servidor
   cat >> /etc/wireguard/wg0.conf << EOF

   [Peer]
   PublicKey = $public_key
   AllowedIPs = $next_ip/32
   EOF

   # Generar QR code
   qrencode -t ansiutf8 < "$CONFIG_DIR/$CLIENT_NAME.conf" > "$CONFIG_DIR/$CLIENT_NAME.qr"

   # Reiniciar WireGuard
   systemctl restart wg-quick@wg0

   echo "Cliente $CLIENT_NAME añadido con IP $next_ip"
   echo "Configuración guardada en $CONFIG_DIR/$CLIENT_NAME.conf"
   echo "Código QR guardado en $CONFIG_DIR/$CLIENT_NAME.qr"
   echo "
   Escanea este código QR con la app WireGuard:"
   cat "$CONFIG_DIR/$CLIENT_NAME.qr"
   ```
   Guárdalo como 'add_wireguard_peer.sh', dale permisos con 'chmod +x add_wireguard_peer.sh' y ejecútalo con './add_wireguard_peer.sh nombre_cliente'
   </details>

### Nivel 3: Infraestructura Empresarial
_Simula una pequeña empresa con servicios básicos en tu Proxmox._

1. **Despliega un servidor de archivos (Samba o Nextcloud).**
   <details>
   <summary>💡 Ver solución</summary>
   
   Para Nextcloud en LXC:
   1. Crea contenedor: 'pct create 202 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname nextcloud --memory 2048 --net0 name=eth0,bridge=vmbr0,ip=dhcp'
   2. Inicia y accede: 'pct start 202' y 'pct enter 202'
   3. Instala requisitos: 'apt update && apt install -y apache2 mariadb-server libapache2-mod-php php-gd php-json php-mysql php-curl php-mbstring php-intl php-imagick php-xml php-zip unzip'
   4. Configura MariaDB: 'mysql_secure_installation'
   5. Crea base de datos:
   ```sql
   CREATE DATABASE nextcloud;
   CREATE USER 'nextcloud'@'localhost' IDENTIFIED BY 'tu_contraseña';
   GRANT ALL PRIVILEGES ON nextcloud.* TO 'nextcloud'@'localhost';
   FLUSH PRIVILEGES;
   ```
   6. Descarga Nextcloud: 'cd /var/www/html && wget https://download.nextcloud.com/server/releases/latest.zip && unzip latest.zip'
   7. Configura permisos: 'chown -R www-data:www-data /var/www/html/nextcloud'
   8. Configura Apache: Crea '/etc/apache2/sites-available/nextcloud.conf' con la configuración adecuada
   9. Habilita sitio: 'a2ensite nextcloud.conf' y 'systemctl restart apache2'
   10. Accede vía web y completa la instalación
   </details>

2. **Configura un servidor web con Nginx o Apache.**
   <details>
   <summary>💡 Ver solución</summary>
   
   Para Nginx en LXC:
   1. Crea contenedor: 'pct create 203 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname webserver --memory 512 --net0 name=eth0,bridge=vmbr0,ip=dhcp'
   2. Inicia y accede: 'pct start 203' y 'pct enter 203'
   3. Instala Nginx: 'apt update && apt install -y nginx'
   4. Crea sitio web: 'mkdir -p /var/www/miempresa'
   5. Crea página HTML: 'nano /var/www/miempresa/index.html'
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>Mi Empresa</title>
       <style>
           body { font-family: Arial; margin: 40px; line-height: 1.6; }
           header { background: #4CAF50; padding: 20px; color: white; text-align: center; }
           .container { padding: 20px; }
       </style>
   </head>
   <body>
       <header>
           <h1>Bienvenido a Mi Empresa</h1>
       </header>
       <div class="container">
           <h2>Nuestra infraestructura virtualizada</h2>
           <p>Este servidor web está alojado en Proxmox VE 8.</p>
       </div>
   </body>
   </html>
   ```
   6. Configura Nginx: 'nano /etc/nginx/sites-available/miempresa'
   ```
   server {
       listen 80;
       server_name _;
       root /var/www/miempresa;
       index index.html;
       location / {
           try_files $uri $uri/ =404;
       }
   }
   ```
   7. Habilita sitio: 'ln -s /etc/nginx/sites-available/miempresa /etc/nginx/sites-enabled/'
   8. Verifica y reinicia: 'nginx -t' y 'systemctl restart nginx'
   </details>

3. **Implementa un sistema de monitoreo con Prometheus + Grafana.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Crea VM para monitoreo: 'qm create 300 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --net0 name=eth0,bridge=vmbr0,ip=dhcp'
   2. Instala Prometheus:
   ```bash
   wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
   tar xvfz prometheus-*.tar.gz
   cd prometheus-*
   ./prometheus --config.file=prometheus.yml
   ```
   3. Configura como servicio: Crea '/etc/systemd/system/prometheus.service'
   4. Instala Grafana:
   ```bash
   apt-get install -y apt-transport-https software-properties-common
   wget -q -O - https://packages.grafana.com/gpg.key | apt-key add -
   echo "deb https://packages.grafana.com/oss/deb stable main" | tee -a /etc/apt/sources.list.d/grafana.list
   apt-get update
   apt-get install -y grafana
   systemctl enable grafana-server
   systemctl start grafana-server
   ```
   5. Instala Node Exporter en cada servidor para monitorear:
   ```bash
   wget https://github.com/prometheus/node_exporter/releases/download/v1.4.0/node_exporter-1.4.0.linux-amd64.tar.gz
   tar xvfz node_exporter-*.tar.gz
   cd node_exporter-*
   ./node_exporter
   ```
   6. Configura Prometheus para recopilar métricas de los exporters
   7. Accede a Grafana (http://ip-servidor:3000) y configura el datasource de Prometheus
   8. Importa dashboards predefinidos para Node Exporter (ID: 1860)
   </details>

4. **Despliega un servidor de correo simple (Poste.io).**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Crea contenedor LXC privilegiado: 'pct create 204 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname mailserver --memory 1024 --net0 name=eth0,bridge=vmbr0,ip=dhcp --features nesting=1'
   2. Inicia y accede: 'pct start 204' y 'pct enter 204'
   3. Instala Docker: 'apt update && apt install -y docker.io'
   4. Ejecuta Poste.io:
   ```bash
   docker run -d --name=mailserver \
     -p 25:25 -p 110:110 -p 143:143 -p 587:587 -p 993:993 -p 995:995 -p 4190:4190 -p 80:80 -p 443:443 \
     -v /etc/localtime:/etc/localtime:ro \
     -v /var/mail-data:/data \
     -e TZ=Europe/Madrid \
     -e HTTPS=OFF \
     -e DOMAIN=mail.tudominio.local \
     -e DISABLE_CLAMAV=TRUE \
     --restart=always \
     analogic/poste.io
   ```
   5. Accede a la interfaz web (http://ip-contenedor) y completa la configuración
   6. Configura registros DNS si tienes un dominio real
   7. Configura clientes de correo para probar
   </details>

5. **Configura un sistema de logs centralizado (Graylog).**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Crea VM para Graylog: 'qm create 301 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 4096 --net0 name=eth0,bridge=vmbr0,ip=dhcp'
   2. Instala requisitos:
   ```bash
   apt update && apt install -y apt-transport-https openjdk-11-jre-headless uuid-runtime pwgen
   ```
   3. Instala MongoDB:
   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
   echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
   apt update && apt install -y mongodb-org
   systemctl enable mongod && systemctl start mongod
   ```
   4. Instala Elasticsearch:
   ```bash
   wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -
   echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | tee /etc/apt/sources.list.d/elastic-7.x.list
   apt update && apt install -y elasticsearch
   ```
   5. Configura Elasticsearch: Edita '/etc/elasticsearch/elasticsearch.yml'
   6. Instala Graylog:
   ```bash
   wget https://packages.graylog2.org/repo/packages/graylog-4.2-repository_latest.deb
   dpkg -i graylog-4.2-repository_latest.deb
   apt update && apt install -y graylog-server
   ```
   7. Configura Graylog: Edita '/etc/graylog/server/server.conf'
   8. Inicia servicios: 'systemctl enable graylog-server && systemctl start graylog-server'
   9. Accede a la interfaz web (http://ip-servidor:9000)
   </details>

### Nivel 4: Automatización y DevOps
_Implementa herramientas de automatización y DevOps en tu entorno Proxmox._

1. **Configura Ansible para gestionar tus VMs y contenedores.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Instala Ansible en tu máquina de control: 'apt update && apt install -y ansible'
   2. Configura SSH sin contraseña a tus VMs/contenedores
   3. Crea estructura de directorios:
   ```bash
   mkdir -p ~/ansible-proxmox/{inventory,playbooks,roles}
   cd ~/ansible-proxmox
   ```
   4. Crea inventario: 'nano inventory/hosts'
   ```ini
   [webservers]
   web1 ansible_host=192.168.1.101
   web2 ansible_host=192.168.1.102
   
   [dbservers]
   db1 ansible_host=192.168.1.201
   
   [monitoring]
   monitor ansible_host=192.168.1.150
   ```
   5. Crea playbook para actualizar sistemas: 'nano playbooks/update.yml'
   ```yaml
   ---
   - name: Actualizar todos los servidores
     hosts: all
     become: yes
     tasks:
       - name: Actualizar caché de apt
         apt:
           update_cache: yes
   
       - name: Actualizar todos los paquetes
         apt:
           upgrade: dist
   
       - name: Reiniciar si es necesario
         reboot:
           reboot_timeout: 3600
         when: ansible_pkg_mgr == 'apt' and reboot_required_file.stat.exists
   ```
   6. Ejecuta playbook: 'ansible-playbook -i inventory/hosts playbooks/update.yml'
   </details>

2. **Despliega un clúster Kubernetes (k3s) en VMs de Proxmox.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Crea 3 VMs para Kubernetes (1 master, 2 workers):
   ```bash
   # Master
   qm create 400 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp
   # Workers
   qm create 401 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp
   qm create 402 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp
   ```
   2. En el nodo master, instala k3s:
   ```bash
   curl -sfL https://get.k3s.io | sh -
   ```
   3. Obtén el token: 'cat /var/lib/rancher/k3s/server/node-token'
   4. En los workers, instala k3s como agente:
   ```bash
   curl -sfL https://get.k3s.io | K3S_URL=https://IP-DEL-MASTER:6443 K3S_TOKEN=ELTOKEN sh -
   ```
   5. Verifica en el master: 'kubectl get nodes'
   6. Despliega una aplicación de prueba:
   ```bash
   kubectl create deployment nginx --image=nginx
   kubectl expose deployment nginx --port=80 --type=NodePort
   kubectl get svc nginx # Para ver el puerto asignado
   ```
   7. Instala dashboard (opcional):
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.5.0/aio/deploy/recommended.yaml
   ```
   </details>

3. **Implementa un sistema CI/CD con GitLab o Jenkins.**
   <details>
   <summary>💡 Ver solución</summary>
   
   Para GitLab en VM:
   1. Crea VM: 'qm create 500 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 4096 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp'
   2. Instala dependencias:
   ```bash
   apt update && apt install -y curl openssh-server ca-certificates perl postfix
   ```
   3. Añade repositorio GitLab:
   ```bash
   curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | bash
   ```
   4. Instala GitLab:
   ```bash
   DEBIAN_FRONTEND=noninteractive apt install gitlab-ce
   ```
   5. Configura GitLab: 'nano /etc/gitlab/gitlab.rb'
   ```ruby
   external_url 'http://gitlab.tudominio.local'
   ```
   6. Reconfigura: 'gitlab-ctl reconfigure'
   7. Accede vía web y configura usuario admin
   8. Crea proyecto de ejemplo
   9. Configura .gitlab-ci.yml en tu proyecto:
   ```yaml
   stages:
     - build
     - test
     - deploy
   
   build-job:
     stage: build
     script:
       - echo "Compilando la aplicación..."
       - echo "Compilación completada."
   
   test-job:
     stage: test
     script:
       - echo "Ejecutando tests..."
       - echo "Tests completados."
   
   deploy-job:
     stage: deploy
     script:
       - echo "Desplegando aplicación..."
       - echo "Aplicación desplegada."
   ```
   10. Configura GitLab Runner para ejecutar los pipelines
   </details>

4. **Crea un registro Docker privado para tus imágenes.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Crea contenedor LXC: 'pct create 205 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname docker-registry --memory 1024 --net0 name=eth0,bridge=vmbr0,ip=dhcp --features nesting=1'
   2. Inicia y accede: 'pct start 205' y 'pct enter 205'
   3. Instala Docker: 'apt update && apt install -y docker.io'
   4. Crea directorio para datos: 'mkdir -p /var/lib/registry'
   5. Ejecuta registro Docker:
   ```bash
   docker run -d \
     -p 5000:5000 \
     --restart=always \
     --name registry \
     -v /var/lib/registry:/var/lib/registry \
     registry:2
   ```
   6. Para usar autenticación, configura htpasswd:
   ```bash
   apt install -y apache2-utils
   htpasswd -Bc /var/lib/registry/auth/htpasswd usuario
   ```
   7. Reinicia con autenticación:
   ```bash
   docker stop registry
   docker rm registry
   docker run -d \
     -p 5000:5000 \
     --restart=always \
     --name registry \
     -v /var/lib/registry:/var/lib/registry \
     -v /var/lib/registry/auth:/auth \
     -e "REGISTRY_AUTH=htpasswd" \
     -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
     -e "REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd" \
     registry:2
   ```
   8. En clientes Docker, añade el registro: 'nano /etc/docker/daemon.json'
   ```json
   {
     "insecure-registries" : ["ip-del-registro:5000"]
   }
   ```
   9. Prueba: 'docker pull ubuntu:20.04', 'docker tag ubuntu:20.04 ip-del-registro:5000/ubuntu:20.04', 'docker push ip-del-registro:5000/ubuntu:20.04'
   </details>

5. **Configura Terraform para gestionar recursos de Proxmox.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Instala Terraform en tu máquina de control:
   ```bash
   wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   apt update && apt install terraform
   ```
   2. Crea usuario API en Proxmox:
      - Ve a Datacenter > Permisos > Usuarios > Añadir
      - Crea usuario 'terraform-prov'
      - Crea token API para este usuario
      - Asigna permisos adecuados
   3. Crea directorio de proyecto: 'mkdir -p ~/terraform-proxmox && cd ~/terraform-proxmox'
   4. Crea archivo de configuración: 'nano main.tf'
   ```hcl
   terraform {
     required_providers {
       proxmox = {
         source = "telmate/proxmox"
         version = "2.9.11"
       }
     }
   }
   
   provider "proxmox" {
     pm_api_url = "https://tu-servidor-proxmox:8006/api2/json"
     pm_api_token_id = "terraform-prov@pam!terraform-token"
     pm_api_token_secret = "tu-token-secreto"
     pm_tls_insecure = true
   }
   
   resource "proxmox_vm_qemu" "test_server" {
     count = 2
     name = "test-vm-${count.index + 1}"
     target_node = "pve"
     clone = "debian-template"
     os_type = "cloud-init"
     cores = 2
     sockets = 1
     cpu = "host"
     memory = 2048
     scsihw = "virtio-scsi-pci"
     bootdisk = "scsi0"
     disk {
       size = "20G"
       type = "scsi"
       storage = "local-lvm"
     }
     network {
       model = "virtio"
       bridge = "vmbr0"
     }
     ipconfig0 = "ip=dhcp"
   }
   ```
   5. Inicializa Terraform: 'terraform init'
   6. Planifica: 'terraform plan'
   7. Aplica: 'terraform apply'
   </details>

### Nivel 5: Seguridad y Redes Avanzadas
_Mejora la seguridad y configuración de red de tu entorno Proxmox._

1. **Configura VLANs en Proxmox para segmentar tu red.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Configura el switch físico para soportar VLANs (si es necesario)
   2. En Proxmox, ve a Datacenter > tu-nodo > System > Network
   3. Añade VLAN-aware bridge: Haz clic en Create > Linux Bridge
      - Name: vmbr1
      - VLAN aware: Sí
      - Bridge ports: tu interfaz física (ej: enp1s0)
   4. Aplica cambios y reinicia servicios de red
   5. Para crear una VM en una VLAN específica:
      - Al crear VM, en la configuración de red selecciona vmbr1
      - En el campo VLAN Tag, introduce el ID de VLAN (ej: 10)
   6. Para contenedores LXC:
   ```bash
   pct set 100 -net0 name=eth0,bridge=vmbr1,tag=20,type=veth
   ```
   7. Verifica la conectividad entre VMs/contenedores en la misma VLAN
   8. Verifica el aislamiento entre diferentes VLANs
   </details>

2. **Implementa pfSense/OPNsense como router/firewall virtual.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Descarga ISO de pfSense: https://www.pfsense.org/download/
   2. Crea VM en Proxmox:
   ```bash
   qm create 600 --memory 2048 --cores 2 --name pfsense-fw --net0 model=virtio,bridge=vmbr0 --net1 model=virtio,bridge=vmbr1
   ```
   3. Monta ISO y configura arranque desde CD/DVD
   4. Inicia VM y sigue el asistente de instalación de pfSense
   5. Asigna interfaces:
      - WAN: vtnet0 (conectada a vmbr0/Internet)
      - LAN: vtnet1 (conectada a vmbr1/Red interna)
   6. Configura IP LAN (por defecto 192.168.1.1)
   7. Accede a la interfaz web desde una VM en la LAN
   8. Configura reglas de firewall:
      - Permitir tráfico LAN a WAN
      - Bloquear tráfico WAN a LAN excepto servicios específicos
   9. Configura NAT para que las VMs internas accedan a Internet
   10. Configura DHCP para la red interna
   11. Opcional: Configura VPN para acceso remoto
   </details>

3. **Implementa IDS/IPS con Suricata para monitorear tráfico.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Crea VM para Suricata: 'qm create 601 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp'
   2. Instala Suricata:
   ```bash
   apt update && apt install -y suricata
   ```
   3. Configura Suricata: 'nano /etc/suricata/suricata.yaml'
      - Configura la interfaz de monitoreo
      - Ajusta reglas y umbrales
   4. Habilita modo IPS (si deseas bloquear tráfico malicioso):
   ```yaml
   # En suricata.yaml
   action-order:
     - pass
     - drop
     - reject
     - alert
   ```
   5. Configura reglas: 'suricata-update'
   6. Inicia Suricata: 'systemctl enable suricata && systemctl start suricata'
   7. Monitorea alertas: 'tail -f /var/log/suricata/fast.log'
   8. Integra con ELK o Grafana para visualización:
      - Instala Filebeat para enviar logs a Elasticsearch
      - Crea dashboards en Kibana o Grafana
   9. Prueba con herramientas como nmap para verificar detección
   </details>

4. **Configura autenticación de dos factores para Proxmox.**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Accede a Proxmox VE como administrador
   2. Instala módulo OATH para PAM:
   ```bash
   apt update && apt install -y libpam-oath
   ```
   3. Crea directorio para tokens: 'mkdir -p /etc/oath/users'
   4. Genera clave para un usuario:
   ```bash
   cd /etc/oath/users
   head -c 1024 /dev/urandom | openssl dgst -sha1 -binary | head -c 20 | base32 > usuario
   chown root:www-data usuario
   chmod 640 usuario
   ```
   5. Configura PAM: 'nano /etc/pam.d/pveproxy'
   ```
   auth requisite pam_oath.so usersfile=/etc/oath/users/
   auth include pam_unix.so
   ```
   6. Configura la aplicación Google Authenticator en tu móvil:
      - Escanea el QR generado con la clave
      - O introduce manualmente la clave base32
   7. Reinicia el servicio pveproxy: 'systemctl restart pveproxy'
   8. Prueba el inicio de sesión: ahora deberás introducir usuario, contraseña y código OTP
   </details>

5. **Implementa un sistema de detección de vulnerabilidades (OpenVAS).**
   <details>
   <summary>💡 Ver solución</summary>
   
   1. Crea VM para OpenVAS/Greenbone: 'qm create 602 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 4096 --cores 4 --net0 name=eth0,bridge=vmbr0,ip=dhcp'
   2. Instala Docker y Docker Compose:
   ```bash
   apt update && apt install -y docker.io docker-compose
   ```
   3. Crea directorio para Greenbone: 'mkdir -p ~/greenbone && cd ~/greenbone'
   4. Crea docker-compose.yml:
   ```yaml
   version: '3'
   services:
     vulnerability-tests:
       image: greenbone/vulnerability-tests
       environment:
         STORAGE_PATH: /var/lib/openvas/22.04/vt-data
       volumes:
         - vt-data:/var/lib/openvas/22.04/vt-data
     notus-data:
       image: greenbone/notus-data
       volumes:
         - notus-data:/var/lib/openvas/22.04/notus
     scap-data:
       image: greenbone/scap-data
       volumes:
         - scap-data:/var/lib/openvas/22.04/scap-data
     cert-bund-data:
       image: greenbone/cert-bund-data
       volumes:
         - cert-bund-data:/var/lib/openvas/22.04/cert-data
     dfn-cert-data:
       image: greenbone/dfn-cert-data
       volumes:
         - dfn-cert-data:/var/lib/openvas/22.04/cert-data
     data-objects:
       image: greenbone/data-objects
       volumes:
         - data-objects:/var/lib/openvas/22.04/data-objects
     report-formats:
       image: greenbone/report-formats
       volumes:
         - report-formats:/var/lib/openvas/22.04/report-formats
     gpg-data:
       image: greenbone/gpg-data
       volumes:
         - gpg-data:/etc/openvas/gnupg
     redis-server:
       image: greenbone/redis-server
       volumes:
         - redis-socket:/run/redis/
     pg-gvm:
       image: greenbone/pg-gvm:stable
       volumes:
         - psql-data:/var/lib/postgresql
       environment:
         POSTGRES_PASSWORD: postgres
         POSTGRES_USER: postgres
     gvmd:
       image: greenbone/gvmd:stable
       volumes:
         - gvmd-data:/var/lib/gvm
       depends_on:
         - pg-gvm
         - gpg-data
     gsa:
       image: greenbone/gsa:stable
       ports:
         - 9392:80
       depends_on:
         - gvmd
     ospd-openvas:
       image: greenbone/ospd-openvas:stable
       volumes:
         - notus-data:/var/lib/openvas/22.04/notus
         - vt-data:/var/lib/openvas/22.04/vt-data
         - redis-socket:/run/redis/
       depends_on:
         - redis-server
         - gpg-data
     mqtt-broker:
       image: greenbone/mqtt-broker
       ports:
         - 1883:1883
       volumes:
         - mqtt-broker-data:/var/lib/mosquitto
     notus-scanner:
       image: greenbone/notus-scanner:stable
       volumes:
         - notus-data:/var/lib/openvas/22.04/notus
       depends_on:
         - mqtt-broker
         - gpg-data
   
   volumes:
     gpg-data:
     vt-data:
     notus-data:
     scap-data:
     cert-bund-data:
     dfn-cert-data:
     data-objects:
     report-formats:
     gvmd-data:
     psql-data:
     redis-socket:
     mqtt-broker-data:
   ```
   5. Inicia Greenbone: 'docker-compose up -d'
   6. Espera a que todos los servicios estén en funcionamiento (puede tardar varios minutos)
   7. Accede a la interfaz web: https://ip-servidor:9392
   8. Inicia sesión con admin/admin y cambia la contraseña
   9. Configura un escaneo de vulnerabilidades para tus servidores
   </details>

## 📦 Instalación

```bash
npm install
```

## 🚀 Desarrollo

```bash
npm run dev
```

## 🛠️ Build + Deploy a GitHub Pages

1. Compila el sitio:
```bash
npm run build
```

2. Publica en GitHub Pages:
```bash
npm run deploy
```

_Asegúrate de tener configurado `gh-pages` y que tu repo esté conectado a GitHub._

## 💾 Guardado de Progreso

Tu progreso se guarda automáticamente en el navegador usando localStorage.

## 🔍 Cómo usar las soluciones

Cada tarea incluye un botón "Ver solución" que despliega instrucciones detalladas para completar el reto. Estas soluciones están diseñadas para servir como guía paso a paso, permitiéndote aprender mientras implementas cada desafío en tu entorno Proxmox.