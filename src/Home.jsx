
import { useState, useEffect } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
const levels = [
  {
    level: 1,
    title: "El Forjador de Máquinas",
    description: "Domina Proxmox, la consola, y automatiza lo básico.",
    tasks: [
      {
        text: "Crea 3 VMs manualmente desde la GUI y desde la CLI.",
        solution: "1. Desde la GUI: Ve a 'Create VM', configura nombre, sistema operativo, disco y red.\n2. Desde CLI: Usa 'qm create [vmid] --memory [MB] --net0 virtio,bridge=vmbr0 --name [nombre]'.\n3. Añade un disco: 'qm set [vmid] --scsi0 local-lvm:10'.\n4. Importa ISO: 'qm set [vmid] --ide2 local:iso/debian-11.0.0-amd64-netinst.iso,media=cdrom'"
      },
      {
        text: "Automatiza la creación de una VM con cloud-init.",
        solution: "1. Descarga imagen cloud: 'wget https://cloud-images.ubuntu.com/focal/current/focal-server-cloudimg-amd64.img'\n2. Crea VM: 'qm create 9000 --memory 2048 --net0 virtio,bridge=vmbr0'\n3. Importa disco: 'qm importdisk 9000 focal-server-cloudimg-amd64.img local-lvm'\n4. Configura disco: 'qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0'\n5. Añade cloud-init: 'qm set 9000 --ide2 local-lvm:cloudinit'\n6. Configura boot: 'qm set 9000 --boot c --bootdisk scsi0'\n7. Configura cloud-init: 'qm set 9000 --ciuser tu_usuario --cipassword tu_contraseña --ipconfig0 ip=dhcp'"
      },
      {
        text: "Explora pvesh y haz un script que te liste el estado de todas las VMs.",
        solution: "Script bash para listar VMs:\n```bash\n#!/bin/bash\necho \"Estado de VMs en Proxmox:\"\necho \"======================\"\npvesh get /cluster/resources --type vm | grep -v 'type|memory|maxdisk|maxmem' | awk '{print \"VM ID: \" $1 \"\\tNombre: \" $2 \"\\tEstado: \" $3}'\n```\nGuárdalo como 'listar_vms.sh', dale permisos con 'chmod +x listar_vms.sh' y ejecútalo."
      },
      {
        text: "Configura backups programados (vzdump) + snapshots automáticos.",
        solution: "1. Configura backup desde GUI: Datacenter > Backup > Add\n2. Configura horario, almacenamiento y modo de compresión\n3. Para snapshots automáticos, crea script:\n```bash\n#!/bin/bash\n# Crear snapshot antes de actualizaciones\nVMID=100 # Cambia por tu VMID\nSNAPNAME=\"pre-update-$(date +%Y%m%d)\"\nqm snapshot $VMID $SNAPNAME -description \"Snapshot automático pre-actualización\"\n```\n4. Programa con crontab: '0 2 * * 0 /ruta/al/script/snapshot.sh'"
      },
      {
        text: "Instala un contenedor LXC optimizado (ej: Alpine o Debian mínimo).",
        solution: "1. Descarga template: 'pveam update' y 'pveam available'\n2. Busca Alpine: 'pveam available | grep alpine'\n3. Descarga template: 'pveam download local alpine-3.16-default_20220622_amd64.tar.xz'\n4. Crea contenedor: 'pct create 200 local:vztmpl/alpine-3.16-default_20220622_amd64.tar.xz --hostname alpine-mini --memory 512 --net0 name=eth0,bridge=vmbr0,ip=dhcp'\n5. Inicia: 'pct start 200'\n6. Accede: 'pct enter 200'"
      },
      {
        text: "Bonus: Script bash que clona una VM base, la renombra y la lanza.",
        solution: "```bash\n#!/bin/bash\n# Script para clonar VM base\n\n# Variables\nBASE_VMID=9000  # ID de tu VM base\nNEW_NAME=$1     # Primer argumento: nombre de la nueva VM\n\nif [ -z \"$NEW_NAME\" ]; then\n  echo \"Error: Debes proporcionar un nombre para la nueva VM\"\n  echo \"Uso: $0 nombre_nueva_vm\"\n  exit 1\nfi\n\n# Encuentra el siguiente VMID disponible\nNEXT_ID=$(pvesh get /cluster/nextid)\necho \"Clonando VM $BASE_VMID a nueva VM $NEXT_ID con nombre $NEW_NAME\"\n\n# Clona la VM\nqm clone $BASE_VMID $NEXT_ID --name $NEW_NAME\n\n# Inicia la VM\nqm start $NEXT_ID\n\necho \"VM $NEW_NAME creada con ID $NEXT_ID y iniciada correctamente\"\n```\nGuárdalo como 'clonar_vm.sh', dale permisos con 'chmod +x clonar_vm.sh' y ejecútalo con './clonar_vm.sh nombre_vm'"
      }
    ],
  },
  {
    level: 2,
    title: "VPN del Viajero",
    description: "Despliega y configura una VPN segura para acceder a tu Proxmox desde cualquier lugar.",
    tasks: [
      {
        text: "Instala y configura WireGuard en un contenedor o VM.",
        solution: "1. Crea un contenedor LXC Debian: 'pct create 201 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname wireguard-vpn --memory 512 --net0 name=eth0,bridge=vmbr0,ip=dhcp'\n2. Inicia y accede: 'pct start 201' y 'pct enter 201'\n3. Actualiza e instala: 'apt update && apt install -y wireguard iptables'\n4. Genera claves: 'wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey'\n5. Crea configuración: 'nano /etc/wireguard/wg0.conf'\n```\n[Interface]\nAddress = 10.0.0.1/24\nListenPort = 51820\nPrivateKey = <contenido-de-privatekey>\nPostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\nPostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE\n```\n6. Habilita IP forwarding: 'echo 1 > /proc/sys/net/ipv4/ip_forward'\n7. Inicia WireGuard: 'wg-quick up wg0' y 'systemctl enable wg-quick@wg0'"
      },
      {
        text: "Asegura acceso remoto solo desde claves públicas conocidas.",
        solution: "1. En tu PC cliente, instala WireGuard y genera claves: 'wg genkey | tee privatekey | wg pubkey > publickey'\n2. En el servidor, edita la configuración: 'nano /etc/wireguard/wg0.conf'\n3. Añade la sección de peer con la clave pública del cliente:\n```\n[Peer]\nPublicKey = <clave-publica-del-cliente>\nAllowedIPs = 10.0.0.2/32\n```\n4. Reinicia WireGuard: 'systemctl restart wg-quick@wg0'\n5. Configura el cliente con la IP 10.0.0.2/24 y la clave pública del servidor"
      },
      {
        text: "Testea la conexión desde fuera de tu red local.",
        solution: "1. Configura port forwarding en tu router: Puerto externo 51820 UDP -> IP del contenedor WireGuard puerto 51820\n2. Obtén tu IP pública: 'curl ifconfig.me'\n3. En la configuración del cliente, usa esta IP pública\n4. Conéctate desde una red móvil o externa\n5. Verifica la conexión: 'ping 10.0.0.1' y luego intenta acceder a la interfaz web de Proxmox"
      },
      {
        text: "Crea un QR para añadir el túnel desde el móvil fácilmente.",
        solution: "1. Instala qrencode: 'apt install -y qrencode'\n2. Crea configuración para móvil:\n```\n[Interface]\nPrivateKey = <clave-privada-del-movil>\nAddress = 10.0.0.3/24\nDNS = 1.1.1.1, 8.8.8.8\n\n[Peer]\nPublicKey = <clave-publica-del-servidor>\nAllowedIPs = 10.0.0.0/24, 192.168.0.0/24\nEndpoint = <tu-ip-publica>:51820\nPersistentKeepalive = 25\n```\n3. Genera QR: 'qrencode -t ansiutf8 < config-movil.conf'\n4. Escanea con la app WireGuard en tu móvil"
      },
      {
        text: "Automatiza la creación de nuevos peers con un script.",
        solution: "```bash\n#!/bin/bash\n# Script para añadir nuevos peers a WireGuard\n\nif [ -z \"$1\" ]; then\n  echo \"Uso: $0 <nombre_cliente>\"\n  exit 1\nfi\n\nCLIENT_NAME=$1\nCONFIG_DIR=\"/etc/wireguard/clients\"\nSERVER_PUBKEY=$(cat /etc/wireguard/publickey)\nSERVER_IP=\"$(curl -s ifconfig.me)\"\n\n# Crear directorio si no existe\nmkdir -p $CONFIG_DIR\n\n# Generar claves para el cliente\nUMASK=077\nprivate_key=\"$(wg genkey)\"\npublic_key=\"$(echo $private_key | wg pubkey)\"\n\n# Encontrar siguiente IP disponible\nlast_ip=$(grep -h \"AllowedIPs\" /etc/wireguard/wg0.conf | sort | tail -n 1 | grep -oE '10\\.0\\.0\\.[0-9]+')\nif [ -z \"$last_ip\" ]; then\n  next_ip=\"10.0.0.2\"\nelse\n  last_num=$(echo $last_ip | cut -d. -f4)\n  next_num=$((last_num + 1))\n  next_ip=\"10.0.0.$next_num\"\nfi\n\n# Crear configuración del cliente\ncat > \"$CONFIG_DIR/$CLIENT_NAME.conf\" << EOF\n[Interface]\nPrivateKey = $private_key\nAddress = $next_ip/24\nDNS = 1.1.1.1, 8.8.8.8\n\n[Peer]\nPublicKey = $SERVER_PUBKEY\nAllowedIPs = 10.0.0.0/24, 192.168.0.0/24\nEndpoint = $SERVER_IP:51820\nPersistentKeepalive = 25\nEOF\n\n# Añadir peer al servidor\ncat >> /etc/wireguard/wg0.conf << EOF\n\n[Peer]\nPublicKey = $public_key\nAllowedIPs = $next_ip/32\nEOF\n\n# Generar QR code\nqrencode -t ansiutf8 < \"$CONFIG_DIR/$CLIENT_NAME.conf\" > \"$CONFIG_DIR/$CLIENT_NAME.qr\"\n\n# Reiniciar WireGuard\nsystemctl restart wg-quick@wg0\n\necho \"Cliente $CLIENT_NAME añadido con IP $next_ip\"\necho \"Configuración guardada en $CONFIG_DIR/$CLIENT_NAME.conf\"\necho \"Código QR guardado en $CONFIG_DIR/$CLIENT_NAME.qr\"\necho \"\nEscanea este código QR con la app WireGuard:\"\ncat \"$CONFIG_DIR/$CLIENT_NAME.qr\"\n```\nGuárdalo como 'add_wireguard_peer.sh', dale permisos con 'chmod +x add_wireguard_peer.sh' y ejecútalo con './add_wireguard_peer.sh nombre_cliente'"
      }
    ]
  },
  {
    level: 3,
    title: "Infraestructura Empresarial",
    description: "Simula una pequeña empresa con servicios básicos en tu Proxmox.",
    tasks: [
      {
        text: "Despliega un servidor de archivos (Samba o Nextcloud).",
        solution: "Para Nextcloud en LXC:\n1. Crea contenedor: 'pct create 202 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname nextcloud --memory 2048 --net0 name=eth0,bridge=vmbr0,ip=dhcp'\n2. Inicia y accede: 'pct start 202' y 'pct enter 202'\n3. Instala requisitos: 'apt update && apt install -y apache2 mariadb-server libapache2-mod-php php-gd php-json php-mysql php-curl php-mbstring php-intl php-imagick php-xml php-zip unzip'\n4. Configura MariaDB: 'mysql_secure_installation'\n5. Crea base de datos:\n```sql\nCREATE DATABASE nextcloud;\nCREATE USER 'nextcloud'@'localhost' IDENTIFIED BY 'tu_contraseña';\nGRANT ALL PRIVILEGES ON nextcloud.* TO 'nextcloud'@'localhost';\nFLUSH PRIVILEGES;\n```\n6. Descarga Nextcloud: 'cd /var/www/html && wget https://download.nextcloud.com/server/releases/latest.zip && unzip latest.zip'\n7. Configura permisos: 'chown -R www-data:www-data /var/www/html/nextcloud'\n8. Configura Apache: Crea '/etc/apache2/sites-available/nextcloud.conf' con la configuración adecuada\n9. Habilita sitio: 'a2ensite nextcloud.conf' y 'systemctl restart apache2'\n10. Accede vía web y completa la instalación"
      },
      {
        text: "Configura un servidor web con Nginx o Apache.",
        solution: "Para Nginx en LXC:\n1. Crea contenedor: 'pct create 203 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname webserver --memory 512 --net0 name=eth0,bridge=vmbr0,ip=dhcp'\n2. Inicia y accede: 'pct start 203' y 'pct enter 203'\n3. Instala Nginx: 'apt update && apt install -y nginx'\n4. Crea sitio web: 'mkdir -p /var/www/miempresa'\n5. Crea página HTML: 'nano /var/www/miempresa/index.html'\n```html\n<!DOCTYPE html>\n<html>\n<head>\n    <title>Mi Empresa</title>\n    <style>\n        body { font-family: Arial; margin: 40px; line-height: 1.6; }\n        header { background: #4CAF50; padding: 20px; color: white; text-align: center; }\n        .container { padding: 20px; }\n    </style>\n</head>\n<body>\n    <header>\n        <h1>Bienvenido a Mi Empresa</h1>\n    </header>\n    <div class=\"container\">\n        <h2>Nuestra infraestructura virtualizada</h2>\n        <p>Este servidor web está alojado en Proxmox VE 8.</p>\n    </div>\n</body>\n</html>\n```\n6. Configura Nginx: 'nano /etc/nginx/sites-available/miempresa'\n```\nserver {\n    listen 80;\n    server_name _;\n    root /var/www/miempresa;\n    index index.html;\n    location / {\n        try_files $uri $uri/ =404;\n    }\n}\n```\n7. Habilita sitio: 'ln -s /etc/nginx/sites-available/miempresa /etc/nginx/sites-enabled/'\n8. Verifica y reinicia: 'nginx -t' y 'systemctl restart nginx'"
      },
      {
        text: "Implementa un sistema de monitoreo con Prometheus + Grafana.",
        solution: "1. Crea VM para monitoreo: 'qm create 300 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --net0 name=eth0,bridge=vmbr0,ip=dhcp'\n2. Instala Prometheus:\n```bash\nwget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz\ntar xvfz prometheus-*.tar.gz\ncd prometheus-*\n./prometheus --config.file=prometheus.yml\n```\n3. Configura como servicio: Crea '/etc/systemd/system/prometheus.service'\n4. Instala Grafana:\n```bash\napt-get install -y apt-transport-https software-properties-common\nwget -q -O - https://packages.grafana.com/gpg.key | apt-key add -\necho \"deb https://packages.grafana.com/oss/deb stable main\" | tee -a /etc/apt/sources.list.d/grafana.list\napt-get update\napt-get install -y grafana\nsystemctl enable grafana-server\nsystemctl start grafana-server\n```\n5. Instala Node Exporter en cada servidor para monitorear:\n```bash\nwget https://github.com/prometheus/node_exporter/releases/download/v1.4.0/node_exporter-1.4.0.linux-amd64.tar.gz\ntar xvfz node_exporter-*.tar.gz\ncd node_exporter-*\n./node_exporter\n```\n6. Configura Prometheus para recopilar métricas de los exporters\n7. Accede a Grafana (http://ip-servidor:3000) y configura el datasource de Prometheus\n8. Importa dashboards predefinidos para Node Exporter (ID: 1860)"
      },
      {
        text: "Despliega un servidor de correo simple (Poste.io).",
        solution: "1. Crea contenedor LXC privilegiado: 'pct create 204 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname mailserver --memory 1024 --net0 name=eth0,bridge=vmbr0,ip=dhcp --features nesting=1'\n2. Inicia y accede: 'pct start 204' y 'pct enter 204'\n3. Instala Docker: 'apt update && apt install -y docker.io'\n4. Ejecuta Poste.io:\n```bash\ndocker run -d --name=mailserver \\\n  -p 25:25 -p 110:110 -p 143:143 -p 587:587 -p 993:993 -p 995:995 -p 4190:4190 -p 80:80 -p 443:443 \\\n  -v /etc/localtime:/etc/localtime:ro \\\n  -v /var/mail-data:/data \\\n  -e TZ=Europe/Madrid \\\n  -e HTTPS=OFF \\\n  -e DOMAIN=mail.tudominio.local \\\n  -e DISABLE_CLAMAV=TRUE \\\n  --restart=always \\\n  analogic/poste.io\n```\n5. Accede a la interfaz web (http://ip-contenedor) y completa la configuración\n6. Configura registros DNS si tienes un dominio real\n7. Configura clientes de correo para probar"
      },
      {
        text: "Configura un sistema de logs centralizado (Graylog).",
        solution: "1. Crea VM para Graylog: 'qm create 301 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 4096 --net0 name=eth0,bridge=vmbr0,ip=dhcp'\n2. Instala requisitos:\n```bash\napt update && apt install -y apt-transport-https openjdk-11-jre-headless uuid-runtime pwgen\n```\n3. Instala MongoDB:\n```bash\nwget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -\necho \"deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main\" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list\napt update && apt install -y mongodb-org\nsystemctl enable mongod && systemctl start mongod\n```\n4. Instala Elasticsearch:\n```bash\nwget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | apt-key add -\necho \"deb https://artifacts.elastic.co/packages/7.x/apt stable main\" | tee /etc/apt/sources.list.d/elastic-7.x.list\napt update && apt install -y elasticsearch\n```\n5. Configura Elasticsearch: Edita '/etc/elasticsearch/elasticsearch.yml'\n6. Instala Graylog:\n```bash\nwget https://packages.graylog2.org/repo/packages/graylog-4.2-repository_latest.deb\ndpkg -i graylog-4.2-repository_latest.deb\napt update && apt install -y graylog-server\n```\n7. Configura Graylog: Edita '/etc/graylog/server/server.conf'\n8. Inicia servicios: 'systemctl enable graylog-server && systemctl start graylog-server'\n9. Accede a la interfaz web (http://ip-servidor:9000)"
      }
    ]
  },
  {
    level: 4,
    title: "Automatización y DevOps",
    description: "Implementa herramientas de automatización y DevOps en tu entorno Proxmox.",
    tasks: [
      {
        text: "Configura Ansible para gestionar tus VMs y contenedores.",
        solution: "1. Instala Ansible en tu máquina de control: 'apt update && apt install -y ansible'\n2. Configura SSH sin contraseña a tus VMs/contenedores\n3. Crea estructura de directorios:\n```bash\nmkdir -p ~/ansible-proxmox/{inventory,playbooks,roles}\ncd ~/ansible-proxmox\n```\n4. Crea inventario: 'nano inventory/hosts'\n```ini\n[webservers]\nweb1 ansible_host=192.168.1.101\nweb2 ansible_host=192.168.1.102\n\n[dbservers]\ndb1 ansible_host=192.168.1.201\n\n[monitoring]\nmonitor ansible_host=192.168.1.150\n```\n5. Crea playbook para actualizar sistemas: 'nano playbooks/update.yml'\n```yaml\n---\n- name: Actualizar todos los servidores\n  hosts: all\n  become: yes\n  tasks:\n    - name: Actualizar caché de apt\n      apt:\n        update_cache: yes\n\n    - name: Actualizar todos los paquetes\n      apt:\n        upgrade: dist\n\n    - name: Reiniciar si es necesario\n      reboot:\n        reboot_timeout: 3600\n      when: ansible_pkg_mgr == 'apt' and reboot_required_file.stat.exists\n```\n6. Ejecuta playbook: 'ansible-playbook -i inventory/hosts playbooks/update.yml'"
      },
      {
        text: "Despliega un clúster Kubernetes (k3s) en VMs de Proxmox.",
        solution: "1. Crea 3 VMs para Kubernetes (1 master, 2 workers):\n```bash\n# Master\nqm create 400 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp\n# Workers\nqm create 401 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp\nqm create 402 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp\n```\n2. En el nodo master, instala k3s:\n```bash\ncurl -sfL https://get.k3s.io | sh -\n```\n3. Obtén el token: 'cat /var/lib/rancher/k3s/server/node-token'\n4. En los workers, instala k3s como agente:\n```bash\ncurl -sfL https://get.k3s.io | K3S_URL=https://IP-DEL-MASTER:6443 K3S_TOKEN=ELTOKEN sh -\n```\n5. Verifica en el master: 'kubectl get nodes'\n6. Despliega una aplicación de prueba:\n```bash\nkubectl create deployment nginx --image=nginx\nkubectl expose deployment nginx --port=80 --type=NodePort\nkubectl get svc nginx # Para ver el puerto asignado\n```\n7. Instala dashboard (opcional):\n```bash\nkubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.5.0/aio/deploy/recommended.yaml\n```"
      },
      {
        text: "Implementa un sistema CI/CD con GitLab o Jenkins.",
        solution: "Para GitLab en VM:\n1. Crea VM: 'qm create 500 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 4096 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp'\n2. Instala dependencias:\n```bash\napt update && apt install -y curl openssh-server ca-certificates perl postfix\n```\n3. Añade repositorio GitLab:\n```bash\ncurl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | bash\n```\n4. Instala GitLab:\n```bash\nDEBIAN_FRONTEND=noninteractive apt install gitlab-ce\n```\n5. Configura GitLab: 'nano /etc/gitlab/gitlab.rb'\n```ruby\nexternal_url 'http://gitlab.tudominio.local'\n```\n6. Reconfigura: 'gitlab-ctl reconfigure'\n7. Accede vía web y configura usuario admin\n8. Crea proyecto de ejemplo\n9. Configura .gitlab-ci.yml en tu proyecto:\n```yaml\nstages:\n  - build\n  - test\n  - deploy\n\nbuild-job:\n  stage: build\n  script:\n    - echo \"Compilando la aplicación...\"\n    - echo \"Compilación completada.\"\n\ntest-job:\n  stage: test\n  script:\n    - echo \"Ejecutando tests...\"\n    - echo \"Tests completados.\"\n\ndeploy-job:\n  stage: deploy\n  script:\n    - echo \"Desplegando aplicación...\"\n    - echo \"Aplicación desplegada.\"\n```\n10. Configura GitLab Runner para ejecutar los pipelines"
      },
      {
        text: "Crea un registro Docker privado para tus imágenes.",
        solution: "1. Crea contenedor LXC: 'pct create 205 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --hostname docker-registry --memory 1024 --net0 name=eth0,bridge=vmbr0,ip=dhcp --features nesting=1'\n2. Inicia y accede: 'pct start 205' y 'pct enter 205'\n3. Instala Docker: 'apt update && apt install -y docker.io'\n4. Crea directorio para datos: 'mkdir -p /var/lib/registry'\n5. Ejecuta registro Docker:\n```bash\ndocker run -d \\\n  -p 5000:5000 \\\n  --restart=always \\\n  --name registry \\\n  -v /var/lib/registry:/var/lib/registry \\\n  registry:2\n```\n6. Para usar autenticación, configura htpasswd:\n```bash\napt install -y apache2-utils\nhtpasswd -Bc /var/lib/registry/auth/htpasswd usuario\n```\n7. Reinicia con autenticación:\n```bash\ndocker stop registry\ndocker rm registry\ndocker run -d \\\n  -p 5000:5000 \\\n  --restart=always \\\n  --name registry \\\n  -v /var/lib/registry:/var/lib/registry \\\n  -v /var/lib/registry/auth:/auth \\\n  -e \"REGISTRY_AUTH=htpasswd\" \\\n  -e \"REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm\" \\\n  -e \"REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd\" \\\n  registry:2\n```\n8. En clientes Docker, añade el registro: 'nano /etc/docker/daemon.json'\n```json\n{\n  \"insecure-registries\" : [\"ip-del-registro:5000\"]\n}\n```\n9. Prueba: 'docker pull ubuntu:20.04', 'docker tag ubuntu:20.04 ip-del-registro:5000/ubuntu:20.04', 'docker push ip-del-registro:5000/ubuntu:20.04'"
      },
      {
        text: "Configura Terraform para gestionar recursos de Proxmox.",
        solution: "1. Instala Terraform en tu máquina de control:\n```bash\nwget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg\necho \"deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main\" | sudo tee /etc/apt/sources.list.d/hashicorp.list\napt update && apt install terraform\n```\n2. Crea usuario API en Proxmox:\n   - Ve a Datacenter > Permisos > Usuarios > Añadir\n   - Crea usuario 'terraform-prov'\n   - Crea token API para este usuario\n   - Asigna permisos adecuados\n3. Crea directorio de proyecto: 'mkdir -p ~/terraform-proxmox && cd ~/terraform-proxmox'\n4. Crea archivo de configuración: 'nano main.tf'\n```hcl\nterraform {\n  required_providers {\n    proxmox = {\n      source = \"telmate/proxmox\"\n      version = \"2.9.11\"\n    }\n  }\n}\n\nprovider \"proxmox\" {\n  pm_api_url = \"https://tu-servidor-proxmox:8006/api2/json\"\n  pm_api_token_id = \"terraform-prov@pam!terraform-token\"\n  pm_api_token_secret = \"tu-token-secreto\"\n  pm_tls_insecure = true\n}\n\nresource \"proxmox_vm_qemu\" \"test_server\" {\n  count = 2\n  name = \"test-vm-${count.index + 1}\"\n  target_node = \"pve\"\n  clone = \"debian-template\"\n  os_type = \"cloud-init\"\n  cores = 2\n  sockets = 1\n  cpu = \"host\"\n  memory = 2048\n  scsihw = \"virtio-scsi-pci\"\n  bootdisk = \"scsi0\"\n  disk {\n    size = \"20G\"\n    type = \"scsi\"\n    storage = \"local-lvm\"\n  }\n  network {\n    model = \"virtio\"\n    bridge = \"vmbr0\"\n  }\n  ipconfig0 = \"ip=dhcp\"\n}\n```\n5. Inicializa Terraform: 'terraform init'\n6. Planifica: 'terraform plan'\n7. Aplica: 'terraform apply'"
      }
    ]
  },
  {
    level: 5,
    title: "Seguridad y Redes Avanzadas",
    description: "Mejora la seguridad y configuración de red de tu entorno Proxmox.",
    tasks: [
      {
        text: "Configura VLANs en Proxmox para segmentar tu red.",
        solution: "1. Configura el switch físico para soportar VLANs (si es necesario)\n2. En Proxmox, ve a Datacenter > tu-nodo > System > Network\n3. Añade VLAN-aware bridge: Haz clic en Create > Linux Bridge\n   - Name: vmbr1\n   - VLAN aware: Sí\n   - Bridge ports: tu interfaz física (ej: enp1s0)\n4. Aplica cambios y reinicia servicios de red\n5. Para crear una VM en una VLAN específica:\n   - Al crear VM, en la configuración de red selecciona vmbr1\n   - En el campo VLAN Tag, introduce el ID de VLAN (ej: 10)\n6. Para contenedores LXC:\n```bash\npct set 100 -net0 name=eth0,bridge=vmbr1,tag=20,type=veth\n```\n7. Verifica la conectividad entre VMs/contenedores en la misma VLAN\n8. Verifica el aislamiento entre diferentes VLANs"
      },
      {
        text: "Implementa pfSense/OPNsense como router/firewall virtual.",
        solution: "1. Descarga ISO de pfSense: https://www.pfsense.org/download/\n2. Crea VM en Proxmox:\n```bash\nqm create 600 --memory 2048 --cores 2 --name pfsense-fw --net0 model=virtio,bridge=vmbr0 --net1 model=virtio,bridge=vmbr1\n```\n3. Monta ISO y configura arranque desde CD/DVD\n4. Inicia VM y sigue el asistente de instalación de pfSense\n5. Asigna interfaces:\n   - WAN: vtnet0 (conectada a vmbr0/Internet)\n   - LAN: vtnet1 (conectada a vmbr1/Red interna)\n6. Configura IP LAN (por defecto 192.168.1.1)\n7. Accede a la interfaz web desde una VM en la LAN\n8. Configura reglas de firewall:\n   - Permitir tráfico LAN a WAN\n   - Bloquear tráfico WAN a LAN excepto servicios específicos\n9. Configura NAT para que las VMs internas accedan a Internet\n10. Configura DHCP para la red interna\n11. Opcional: Configura VPN para acceso remoto"
      },
      {
        text: "Implementa IDS/IPS con Suricata para monitorear tráfico.",
        solution: "1. Crea VM para Suricata: 'qm create 601 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 2048 --cores 2 --net0 name=eth0,bridge=vmbr0,ip=dhcp'\n2. Instala Suricata:\n```bash\napt update && apt install -y suricata\n```\n3. Configura Suricata: 'nano /etc/suricata/suricata.yaml'\n   - Configura la interfaz de monitoreo\n   - Ajusta reglas y umbrales\n4. Habilita modo IPS (si deseas bloquear tráfico malicioso):\n```yaml\n# En suricata.yaml\naction-order:\n  - pass\n  - drop\n  - reject\n  - alert\n```\n5. Configura reglas: 'suricata-update'\n6. Inicia Suricata: 'systemctl enable suricata && systemctl start suricata'\n7. Monitorea alertas: 'tail -f /var/log/suricata/fast.log'\n8. Integra con ELK o Grafana para visualización:\n   - Instala Filebeat para enviar logs a Elasticsearch\n   - Crea dashboards en Kibana o Grafana\n9. Prueba con herramientas como nmap para verificar detección"
      },
      {
        text: "Configura autenticación de dos factores para Proxmox.",
        solution: "1. Accede a Proxmox VE como administrador\n2. Instala módulo OATH para PAM:\n```bash\napt update && apt install -y libpam-oath\n```\n3. Crea directorio para tokens: 'mkdir -p /etc/oath/users'\n4. Genera clave para un usuario:\n```bash\ncd /etc/oath/users\nhead -c 1024 /dev/urandom | openssl dgst -sha1 -binary | head -c 20 | base32 > usuario\nchown root:www-data usuario\nchmod 640 usuario\n```\n5. Configura PAM: 'nano /etc/pam.d/pveproxy'\n```\nauth requisite pam_oath.so usersfile=/etc/oath/users/\nauth include pam_unix.so\n```\n6. Configura la aplicación Google Authenticator en tu móvil:\n   - Escanea el QR generado con la clave\n   - O introduce manualmente la clave base32\n7. Reinicia el servicio pveproxy: 'systemctl restart pveproxy'\n8. Prueba el inicio de sesión: ahora deberás introducir usuario, contraseña y código OTP"
      },
      {
        text: "Implementa un sistema de detección de vulnerabilidades (OpenVAS).",
        solution: "1. Crea VM para OpenVAS/Greenbone: 'qm create 602 local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst --memory 4096 --cores 4 --net0 name=eth0,bridge=vmbr0,ip=dhcp'\n2. Instala Docker y Docker Compose:\n```bash\napt update && apt install -y docker.io docker-compose\n```\n3. Crea directorio para Greenbone: 'mkdir -p ~/greenbone && cd ~/greenbone'\n4. Crea docker-compose.yml:\n```yaml\nversion: '3'\nservices:\n  vulnerability-tests:\n    image: greenbone/vulnerability-tests\n    environment:\n      STORAGE_PATH: /var/lib/openvas/22.04/vt-data\n    volumes:\n      - vt-data:/var/lib/openvas/22.04/vt-data\n  notus-data:\n    image: greenbone/notus-data\n    volumes:\n      - notus-data:/var/lib/openvas/22.04/notus\n  scap-data:\n    image: greenbone/scap-data\n    volumes:\n      - scap-data:/var/lib/openvas/22.04/scap-data\n  cert-bund-data:\n    image: greenbone/cert-bund-data\n    volumes:\n      - cert-bund-data:/var/lib/openvas/22.04/cert-data\n  dfn-cert-data:\n    image: greenbone/dfn-cert-data\n    volumes:\n      - dfn-cert-data:/var/lib/openvas/22.04/cert-data\n  data-objects:\n    image: greenbone/data-objects\n    volumes:\n      - data-objects:/var/lib/openvas/22.04/data-objects\n  report-formats:\n    image: greenbone/report-formats\n    volumes:\n      - report-formats:/var/lib/openvas/22.04/report-formats\n  gpg-data:\n    image: greenbone/gpg-data\n    volumes:\n      - gpg-data:/etc/openvas/gnupg\n  redis-server:\n    image: greenbone/redis-server\n    volumes:\n      - redis-socket:/run/redis/\n  pg-gvm:\n    image: greenbone/pg-gvm:stable\n    volumes:\n      - psql-data:/var/lib/postgresql\n    environment:\n      POSTGRES_PASSWORD: postgres\n      POSTGRES_USER: postgres\n  gvmd:\n    image: greenbone/gvmd:stable\n    volumes:\n      - gvmd-data:/var/lib/gvm\n    depends_on:\n      - pg-gvm\n      - gpg-data\n  gsa:\n    image: greenbone/gsa:stable\n    ports:\n      - 9392:80\n    depends_on:\n      - gvmd\n  ospd-openvas:\n    image: greenbone/ospd-openvas:stable\n    volumes:\n      - notus-data:/var/lib/openvas/22.04/notus\n      - vt-data:/var/lib/openvas/22.04/vt-data\n      - redis-socket:/run/redis/\n    depends_on:\n      - redis-server\n      - gpg-data\n  mqtt-broker:\n    image: greenbone/mqtt-broker\n    ports:\n      - 1883:1883\n    volumes:\n      - mqtt-broker-data:/var/lib/mosquitto\n  notus-scanner:\n    image: greenbone/notus-scanner:stable\n    volumes:\n      - notus-data:/var/lib/openvas/22.04/notus\n    depends_on:\n      - mqtt-broker\n      - gpg-data\n\nvolumes:\n  gpg-data:\n  vt-data:\n  notus-data:\n  scap-data:\n  cert-bund-data:\n  dfn-cert-data:\n  data-objects:\n  report-formats:\n  gvmd-data:\n  psql-data:\n  redis-socket:\n  mqtt-broker-data:\n```\n5. Inicia Greenbone: 'docker-compose up -d'\n6. Espera a que todos los servicios estén en funcionamiento (puede tardar varios minutos)\n7. Accede a la interfaz web: https://ip-servidor:9392\n8. Inicia sesión con admin/admin y cambia la contraseña\n9. Configura un escaneo de vulnerabilidades para tus servidores"
      }
    ]
  }
];

const STORAGE_KEY = "retogame-progress";

export default function Home() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [openSolutions, setOpenSolutions] = useState({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const toggleTask = (levelIdx, taskIdx) => {
    const key = `l${levelIdx}-t${taskIdx}`;
    setProgress((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleSolution = (levelIdx, taskIdx) => {
    const key = `l${levelIdx}-t${taskIdx}`;
    setOpenSolutions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center text-indigo-300">Reto Admin Proxmox</h1>
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold text-indigo-200">
            Nivel {levels[currentLevel].level}: {levels[currentLevel].title}
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            {levels[currentLevel].description}
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            {levels[currentLevel].tasks.map((task, i) => {
              const key = `l${currentLevel}-t${i}`;
              const completed = progress[key];
              return (
                <li
                  key={i}
                  className={`mb-4 ${completed ? "text-green-500" : ""}`}
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-2">
                      <div 
                        onClick={() => toggleTask(currentLevel, i)}
                        className={`cursor-pointer hover:text-indigo-300 transition-colors ${completed ? "line-through" : ""}`}
                      >
                        {typeof task === 'object' ? task.text : task}
                      </div>
                      {typeof task === 'object' && task.solution && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs whitespace-nowrap"
                          onClick={() => toggleSolution(currentLevel, i)}
                        >
                          💡 Ver solución
                        </Button>
                      )}
                    </div>
                    {typeof task === 'object' && task.solution && openSolutions[`l${currentLevel}-t${i}`] && (
                      <div className="mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md whitespace-pre-wrap text-sm overflow-x-auto">
                        {task.solution}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentLevel(Math.max(currentLevel - 1, 0))}
          disabled={currentLevel === 0}
        >
          Nivel anterior
        </Button>
        <Button
          onClick={() =>
            setCurrentLevel(Math.min(currentLevel + 1, levels.length - 1))
          }
          disabled={currentLevel === levels.length - 1}
        >
          Siguiente nivel
        </Button>
      </div>
    </div>
  );
}
